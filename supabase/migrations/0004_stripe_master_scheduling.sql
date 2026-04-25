-- ==============================================================================
-- MIGRATION 0004: STRIPE + MASTER LOGIN + SISTEMA DE AGENDAMENTO COMPLETO
-- Solara Connect Odonto
-- ==============================================================================

-- ==========================================
-- PARTE 1: STRIPE (substituir PagBank)
-- ==========================================

-- Adicionar campos Stripe na tabela subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Índices para busca rápida por IDs do Stripe
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions(stripe_subscription_id);

-- ==========================================
-- PARTE 2: MASTER LOGIN (acesso livre)
-- ==========================================

-- Flag na clínica para identificar conta master
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;

-- Tabela de emails master (pode ter mais de um no futuro)
CREATE TABLE IF NOT EXISTS public.master_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    descricao TEXT DEFAULT 'Conta de manutenção',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o email master principal
INSERT INTO public.master_emails (email, descricao)
VALUES ('kd3online@gmail.com', 'Conta master do administrador - acesso total sem assinatura')
ON CONFLICT (email) DO NOTHING;

-- RLS: master_emails é público para leitura (o middleware precisa consultar)
ALTER TABLE public.master_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_emails_public_read" ON public.master_emails
    FOR SELECT USING (true);

CREATE POLICY "master_emails_service_write" ON public.master_emails
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- PARTE 3: SISTEMA DE AGENDAMENTO COMPLETO
-- ==========================================

-- 3A: Grade de horários dos especialistas (dias e horários de trabalho)
CREATE TABLE IF NOT EXISTS public.specialist_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
        -- 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
    hora_inicio TIME NOT NULL,           -- Ex: 08:00
    hora_fim TIME NOT NULL,              -- Ex: 18:00
    duracao_slot_minutos INTEGER DEFAULT 30, -- Duração padrão de cada consulta
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Evitar duplicata: mesmo especialista, mesmo dia
    UNIQUE (specialist_id, dia_semana)
);

ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_tenant_policy" ON public.specialist_schedules
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "schedules_service_policy" ON public.specialist_schedules
    FOR ALL USING (auth.role() = 'service_role');

-- 3B: Bloqueios de horário (férias, feriados, indisponibilidade pontual)
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE,
        -- NULL = bloqueio para toda a clínica (feriado)
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo TEXT DEFAULT 'Indisponível',
    tipo TEXT DEFAULT 'manual',  -- manual, feriado, ferias, emergencia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_tenant_policy" ON public.schedule_blocks
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "blocks_service_policy" ON public.schedule_blocks
    FOR ALL USING (auth.role() = 'service_role');

-- 3C: Adicionar campos de reagendamento na tabela appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reagendado_de UUID REFERENCES public.appointments(id),
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS cancelado_por TEXT CHECK (cancelado_por IN ('clinica', 'paciente', 'sistema')),
  ADD COLUMN IF NOT EXISTS valor_procedimento DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- ==========================================
-- PARTE 4: FUNCTION — VERIFICAR CONFLITO DE HORÁRIO
-- ==========================================

CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
    conflito INTEGER;
BEGIN
    -- Verificar se já existe agendamento no mesmo horário para o mesmo especialista
    SELECT COUNT(*) INTO conflito
    FROM public.appointments
    WHERE specialist_id = NEW.specialist_id
      AND appointment_time = NEW.appointment_time
      AND status IN ('pending', 'confirmed')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF conflito > 0 THEN
        RAISE EXCEPTION 'CONFLITO: Já existe uma consulta agendada neste horário para este especialista.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_appointment_conflict
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_conflict();

-- ==========================================
-- PARTE 5: FUNCTION — GERAR SLOTS DISPONÍVEIS
-- (Função utilitária para consultar horários livres)
-- ==========================================

CREATE OR REPLACE FUNCTION get_available_slots(
    p_clinic_id UUID,
    p_specialist_id UUID,
    p_data DATE
)
RETURNS TABLE (
    horario_inicio TIMESTAMP WITH TIME ZONE,
    horario_fim TIMESTAMP WITH TIME ZONE,
    specialist_nome TEXT
) AS $$
DECLARE
    v_dia_semana INTEGER;
    v_schedule RECORD;
    v_slot_start TIMESTAMP WITH TIME ZONE;
    v_slot_end TIMESTAMP WITH TIME ZONE;
BEGIN
    v_dia_semana := EXTRACT(DOW FROM p_data);

    -- Buscar a grade do especialista para este dia da semana
    FOR v_schedule IN
        SELECT ss.hora_inicio, ss.hora_fim, ss.duracao_slot_minutos, s.nome
        FROM public.specialist_schedules ss
        JOIN public.specialists s ON s.id = ss.specialist_id
        WHERE ss.specialist_id = p_specialist_id
          AND ss.clinic_id = p_clinic_id
          AND ss.dia_semana = v_dia_semana
          AND ss.ativo = TRUE
    LOOP
        v_slot_start := p_data + v_schedule.hora_inicio;
        
        WHILE v_slot_start + (v_schedule.duracao_slot_minutos || ' minutes')::interval 
              <= p_data + v_schedule.hora_fim
        LOOP
            v_slot_end := v_slot_start + (v_schedule.duracao_slot_minutos || ' minutes')::interval;
            
            -- Verificar se NÃO existe agendamento neste slot
            IF NOT EXISTS (
                SELECT 1 FROM public.appointments
                WHERE specialist_id = p_specialist_id
                  AND appointment_time = v_slot_start
                  AND status IN ('pending', 'confirmed')
            )
            -- Verificar se NÃO está bloqueado
            AND NOT EXISTS (
                SELECT 1 FROM public.schedule_blocks
                WHERE (specialist_id = p_specialist_id OR specialist_id IS NULL)
                  AND clinic_id = p_clinic_id
                  AND v_slot_start >= data_inicio
                  AND v_slot_start < data_fim
            )
            THEN
                horario_inicio := v_slot_start;
                horario_fim := v_slot_end;
                specialist_nome := v_schedule.nome;
                RETURN NEXT;
            END IF;
            
            v_slot_start := v_slot_end;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PARTE 6: ÍNDICES DE PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_schedules_specialist ON public.specialist_schedules(specialist_id);
CREATE INDEX IF NOT EXISTS idx_schedules_clinic ON public.specialist_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_blocks_specialist ON public.schedule_blocks(specialist_id);
CREATE INDEX IF NOT EXISTS idx_blocks_dates ON public.schedule_blocks(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_appointments_specialist_time
  ON public.appointments(specialist_id, appointment_time)
  WHERE status IN ('pending', 'confirmed');

-- ==========================================
-- FIM DA MIGRATION 0004
-- ==========================================
