-- ==============================================================================
-- CORTEX CALL - SCHEMA COMPLETO (MULTI-TENANT + RLS + PLANOS)
-- Versão Final Unificada
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA 1: CLINICS (TENANT / INSTÂNCIA BASE)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Dono da clínica (auth)
    nome_clinica TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cnpj TEXT,
    endereco TEXT,
    evolution_instance_name TEXT,
    evolution_webhook_id TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- O dono da clínica só vê a própria clínica
CREATE POLICY "clinics_owner_policy" ON public.clinics
    FOR ALL USING (user_id = auth.uid());

-- Service role pode tudo (webhook, admin)
CREATE POLICY "clinics_service_policy" ON public.clinics
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- TABELA 2: PLANS (PLANOS DISPONÍVEIS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    preco_centavos INTEGER NOT NULL,
    max_especialistas INTEGER NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Planos são públicos para leitura
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans
    FOR SELECT USING (true);

-- Inserir os 3 planos padrão
INSERT INTO public.plans (nome, slug, preco_centavos, max_especialistas, features) VALUES
(
    '2 Especialistas',
    'plan-2-especialistas',
    14700,
    2,
    '["Até 2 Especialistas", "Solara Connect IA", "Otimização de Agenda", "Suporte WhatsApp"]'::jsonb
),
(
    '3 a 5 Especialistas',
    'plan-3-5-especialistas',
    25700,
    5,
    '["Até 5 Especialistas", "Solara Connect Pro", "WhatsApp Odonto Ilimitado", "Suporte Prioritário"]'::jsonb
),
(
    '5 a 8 Especialistas',
    'plan-5-8-especialistas',
    36700,
    8,
    '["Até 8 Especialistas", "Solara Connect Elite", "Gestor de Contas", "Integração Customizada"]'::jsonb
);

-- ==========================================
-- TABELA 3: SUBSCRIPTIONS (ASSINATURAS)
-- ==========================================
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'expired', 'overdue');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status DEFAULT 'pending',
    pagbank_subscription_id TEXT,
    pagbank_charge_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_tenant_policy" ON public.subscriptions
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "subscriptions_service_policy" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- TABELA 4: SPECIALISTS (ESPECIALISTAS POR CLÍNICA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.specialists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    cro TEXT,              -- Registro profissional
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "specialists_tenant_policy" ON public.specialists
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "specialists_service_policy" ON public.specialists
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- TABELA 5: PATIENTS / LEADS (PACIENTES POR CLÍNICA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome_completo TEXT,                    -- Pode ser NULL inicialmente (lead novo)
    telefone TEXT NOT NULL,
    email TEXT,
    temperatura_lead TEXT DEFAULT 'novo',    -- novo, morno, frio, perdido, convertido
    origem TEXT DEFAULT 'whatsapp',          -- whatsapp, site, indicacao, campanha
    ultima_consulta TIMESTAMP WITH TIME ZONE,
    dados_extras JSONB DEFAULT '{}'::jsonb,  -- Campos adicionais flexíveis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (clinic_id, telefone)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_tenant_policy" ON public.patients
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "patients_service_policy" ON public.patients
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- TABELA 6: APPOINTMENTS (AGENDAMENTOS)
-- ==========================================
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_procedimento TEXT,
    observacoes TEXT,
    status appointment_status DEFAULT 'pending',
    lembrete_2h_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_tenant_policy" ON public.appointments
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "appointments_service_policy" ON public.appointments
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- TABELA 7: AI_CONVERSATIONS (Logs do Agente SPIN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    telefone_remetente TEXT,         -- Telefone de quem mandou a msg (caso patient_id seja null ainda)
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    etapa_spin TEXT,                 -- situacao, problema, implicacao, necessidade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_tenant_policy" ON public.ai_conversations
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "conversations_service_policy" ON public.ai_conversations
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- FUNCTION + TRIGGER: LIMITE DE ESPECIALISTAS
-- ==========================================
CREATE OR REPLACE FUNCTION check_specialist_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.specialists
    WHERE clinic_id = NEW.clinic_id AND ativo = TRUE;

    SELECT p.max_especialistas INTO max_allowed
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.clinic_id = NEW.clinic_id
      AND s.status = 'active';

    IF max_allowed IS NULL THEN
        RAISE EXCEPTION 'LIMITE_ERRO: Nenhum plano ativo. Assine um plano para cadastrar especialistas.';
    END IF;

    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'LIMITE_ERRO: Limite atingido (% de %). Faça upgrade do plano.', current_count, max_allowed;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_specialist_limit
    BEFORE INSERT ON public.specialists
    FOR EACH ROW
    EXECUTE FUNCTION check_specialist_limit();

-- ==========================================
-- FUNCTION: updated_at automático
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clinics_updated_at
    BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX idx_clinics_user ON public.clinics(user_id);
CREATE INDEX idx_subscriptions_clinic ON public.subscriptions(clinic_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_specialists_clinic ON public.specialists(clinic_id);
CREATE INDEX idx_patients_telefone ON public.patients(telefone);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_patients_temperatura ON public.patients(temperatura_lead);
CREATE INDEX idx_appointments_time ON public.appointments(appointment_time) WHERE status = 'pending';
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_conversations_clinic ON public.ai_conversations(clinic_id);
CREATE INDEX idx_conversations_patient ON public.ai_conversations(patient_id);
CREATE INDEX idx_conversations_telefone ON public.ai_conversations(telefone_remetente);
CREATE INDEX idx_plans_slug ON public.plans(slug);
