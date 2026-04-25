-- ==============================================================================
-- CORTEX CALL - SISTEMA COMPLETO DE AGENDAMENTO + NPS + LEMBRETES
-- Execu��o: Supabase SQL Editor
-- ==============================================================================

-- ==========================================
-- 1. CLINICS (TENANT)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome_clinica TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cnpj TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    evolution_instance_name TEXT,
    evolution_webhook_id TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics_owner_policy" ON public.clinics FOR ALL USING (user_id = auth.uid());
CREATE POLICY "clinics_service_policy" ON public.clinics FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 2. PLANS (PLANOS)
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
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);

INSERT INTO public.plans (nome, slug, preco_centavos, max_especialistas, features) VALUES
    ('2 M��dicos', 'plan-2-medicos', 14700, 2, '["Até 2 Médicos", "Cortex Call IA", "Otimização de Agenda", "Suporte WhatsApp"]'::jsonb),
    ('3 a 5 Médicos', 'plan-3-5-medicos', 25700, 5, '["Até 5 Médicos", "Cortex Call Pro", "WhatsApp Ilimitado", "Suporte Prioritário"]'::jsonb),
    ('5 a 8 Médicos', 'plan-5-8-medicos', 36700, 8, '["Até 8 Médicos", "Cortex Call Elite", "Gestor de Contas", "Integração Customizada"]'::jsonb);

-- ==========================================
-- 3. SUBSCRIPTIONS (ASSINATURAS)
-- ==========================================
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'expired', 'overdue');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status DEFAULT 'pending',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_tenant_policy" ON public.subscriptions FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "subscriptions_service_policy" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 4. SPECIALISTS (MÉDICOS/ESPECIALISTAS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.specialists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    crm TEXT,
    telefone TEXT,
    email TEXT,
    foto_url TEXT,
    bio TEXT,
    duracao_consulta INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialists_tenant_policy" ON public.specialists FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "specialists_service_policy" ON public.specialists FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 5. SCHEDULES (GRADE HORÁRIA DOS MÉDICOS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    interval_minutes INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (specialist_id, weekday)
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_tenant_policy" ON public.schedules FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()))
);
CREATE POLICY "schedules_service_policy" ON public.schedules FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 6. PATIENTS (PACIENTES)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome_completo TEXT,
    telefone TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    data_nascimento DATE,
    temperatura_lead TEXT DEFAULT 'novo',
    origem TEXT DEFAULT 'whatsapp',
    ultima_consulta TIMESTAMP WITH TIME ZONE,
    proxima_consulta TIMESTAMP WITH TIME ZONE,
    dados_extras JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (clinic_id, telefone)
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_tenant_policy" ON public.patients FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "patients_service_policy" ON public.patients FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 7. APPOINTMENTS (AGENDAMENTOS)
-- ==========================================
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

CREATE TYPE appointment_type AS ENUM ('consulta', 'retorno', 'exame', 'procedimento', 'urgencia');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end_time TIMESTAMP WITH TIME ZONE,
    tipo appointment_type DEFAULT 'consulta',
    status appointment_status DEFAULT 'scheduled',
    observacoes TEXT,
    motivo TEXT,
    valor DECIMAL(10,2),
    paid BOOLEAN DEFAULT FALSE,
    nps_sent BOOLEAN DEFAULT FALSE,
    nps_answered BOOLEAN DEFAULT FALSE,
    nps_score INTEGER,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_2h_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_tenant_policy" ON public.appointments FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "appointments_service_policy" ON public.appointments FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 8. APPOINTMENT_CANCELLATIONS (CANCELAMENTOS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.appointment_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    motivo_cancelamento TEXT,
    tipo_cancelamento TEXT CHECK (tipo_cancelamento IN ('paciente', 'clinica', 'medico', 'outro')),
    reagendado BOOLEAN DEFAULT FALSE,
    novo_appointment_id UUID REFERENCES public.appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.appointment_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancellations_tenant_policy" ON public.appointment_cancellations FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "cancellations_service_policy" ON public.appointment_cancellations FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 9. APPOINTMENT_REMINDERS (LEMBRETES)
-- ==========================================
CREATE TYPE reminder_type AS ENUM ('24h', '2h', '7d', 'custom');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tipo reminder_type NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT,
    status reminder_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_tenant_policy" ON public.appointment_reminders FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "reminders_service_policy" ON public.appointment_reminders FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 10. NPS_SURVEYS (CONFIGURAÇÃO NPS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.nps_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    send_delay_minutes INTEGER DEFAULT 30,
    send_after_status TEXT DEFAULT 'completed',
    template_mensagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nps_surveys_tenant_policy" ON public.nps_surveys FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "nps_surveys_service_policy" ON public.nps_surveys FOR ALL USING (auth.role() = 'service_role');

INSERT INTO public.nps_surveys (clinic_id, template_mensagem) 
SELECT id, 'Olá {nome_paciente}! 😊 Como foi sua consulta com {nome_medico} hoje? \n\nSua opinião é muito importante para melhorarmos sempre!\n\nNuma escala de 0 a 10, quanto você avalia sua experiência?' FROM public.clinics LIMIT 1;

-- ==========================================
-- 11. NPS_RESPONSES (RESPOSTAS NPS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.nps_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
    feedback TEXT,
    motivo TEXT,
    would_return BOOLEAN,
    recommend BOOLEAN,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nps_responses_tenant_policy" ON public.nps_responses FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "nps_responses_service_policy" ON public.nps_responses FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 12. AI_CONVERSATIONS (CHAT COM IA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    telephone_remetente TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent_detected TEXT,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_tenant_policy" ON public.ai_conversations FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "conversations_service_policy" ON public.ai_conversations FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 13. CAMPAIGNS (CAMPANHAS)
-- ==========================================
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    template_mensagem TEXT NOT NULL,
    status campaign_status DEFAULT 'draft',
    pacientes_count INTEGER DEFAULT 0,
    enviados_count INTEGER DEFAULT 0,
    respondidos_count INTEGER DEFAULT 0,
    convertidos_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_tenant_policy" ON public.campaigns FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "campaigns_service_policy" ON public.campaigns FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 14. RAG_KNOWLEDGE_BASE (BASE IA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rag_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    keywords TEXT[] NOT NULL,
    context TEXT NOT NULL,
    priority_level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.rag_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_read" ON public.rag_knowledge_base FOR SELECT USING (true);

-- ==========================================
-- 15. MASTER_EMAILS (ADMIN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.master_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO public.master_emails (email) VALUES ('kd3online@gmail.com');
ALTER TABLE public.master_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "master_emails_read" ON public.master_emails FOR SELECT USING (true);

-- ==========================================
-- 16. WAITLIST (LISTA DE ESPERA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    telefone TEXT NOT NULL,
    especialidade_desejada TEXT,
    data_preferida DATE,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_tenant_policy" ON public.waitlist FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);

-- ==========================================
-- 17. AUDIT_LOG (LOG DE AUDITORIA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_service_policy" ON public.audit_log FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 18. FUNCTIONS E TRIGGERS
-- ==========================================

-- Updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Verificar conflito de agendamento
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE specialist_id = NEW.specialist_id
        AND appointment_time < COALESCE(NEW.appointment_end_time, NEW.appointment_time + INTERVAL '1 hour')
        AND appointment_time > NEW.appointment_time - INTERVAL '1 hour'
        AND status NOT IN ('cancelled')
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'CONFLITO: Já existe um agendamento para este médico neste horário.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_appointment_conflict
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION check_appointment_conflict();

-- Criar lembretes automaticamente ao criar agendamento
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
DECLARE
    reminder_24h_time TIMESTAMP;
    reminder_2h_time TIMESTAMP;
BEGIN
    -- Lembrete 24h antes
    reminder_24h_time := NEW.appointment_time - INTERVAL '24 hours';
    IF reminder_24h_time > NOW() THEN
        INSERT INTO public.appointment_reminders (appointment_id, clinic_id, patient_id, tipo, scheduled_for, message)
        VALUES (
            NEW.id, NEW.clinic_id, NEW.patient_id, '24h', reminder_24h_time,
            'Olá! Lembramos que você tem uma consulta amanhã às ' || TO_CHAR(NEW.appointment_time, 'HH24:MI') || '. Por favor, confirme sua presença.'
        );
    END IF;
    
    -- Lembrete 2h antes
    reminder_2h_time := NEW.appointment_time - INTERVAL '2 hours';
    IF reminder_2h_time > NOW() THEN
        INSERT INTO public.appointment_reminders (appointment_id, clinic_id, patient_id, tipo, scheduled_for, message)
        VALUES (
            NEW.id, NEW.clinic_id, NEW.patient_id, '2h', reminder_2h_time,
            'Sua consulta começa em 2 horas! ' || TO_CHAR(NEW.appointment_time, 'HH24:MI') || '. Estamos te esperando! 😊'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reminders
    AFTER INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION create_appointment_reminders();

-- Cancelamento automático ao cancelar
CREATE OR REPLACE FUNCTION handle_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE public.appointment_reminders
        SET status = 'cancelled'
        WHERE appointment_id = NEW.id AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_cancellation
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION handle_cancellation();

-- Atualizar NPS após resposta
CREATE OR REPLACE FUNCTION handle_nps_response()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.appointments
    SET nps_answered = TRUE, nps_score = NEW.score
    WHERE id = NEW.appointment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_nps_response
    AFTER INSERT ON public.nps_responses
    FOR EACH ROW EXECUTE FUNCTION handle_nps_response();

-- ==========================================
-- 19. ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX idx_clinics_user ON public.clinics(user_id);
CREATE INDEX idx_subscriptions_clinic ON public.subscriptions(clinic_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_specialists_clinic ON public.specialists(clinic_id);
CREATE INDEX idx_specialists_especialidade ON public.specialists(especialidade);
CREATE INDEX idx_schedules_specialist ON public.schedules(specialist_id, weekday) WHERE ativo = TRUE;
CREATE INDEX idx_patients_telefone ON public.patients(telefone);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_patients_temperatura ON public.patients(temperatura_lead);
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_specialist ON public.appointments(specialist_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_time ON public.appointments(appointment_time);
CREATE INDEX idx_appointments_status ON public.appointments(status) WHERE status = 'scheduled';
CREATE INDEX idx_appointments_nps ON public.appointments(nps_sent, nps_answered) WHERE nps_sent = TRUE AND nps_answered = FALSE;
CREATE INDEX idx_reminders_scheduled ON public.appointment_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_reminders_clinic ON public.appointment_reminders(clinic_id);
CREATE INDEX idx_nps_responses_clinic ON public.nps_responses(clinic_id);
CREATE INDEX idx_nps_responses_score ON public.nps_responses(score);
CREATE INDEX idx_nps_responses_created ON public.nps_responses(created_at);
CREATE INDEX idx_conversations_clinic ON public.ai_conversations(clinic_id);
CREATE INDEX idx_conversations_patient ON public.ai_conversations(patient_id);
CREATE INDEX idx_campaigns_clinic ON public.campaigns(clinic_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_waitlist_clinic ON public.waitlist(clinic_id);
CREATE INDEX idx_audit_log_clinic ON public.audit_log(clinic_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

-- ==========================================
-- 20. KNOWLEDGE BASE NPS + AGENDAMENTO
-- ==========================================
INSERT INTO public.rag_knowledge_base (topic, keywords, context, priority_level) VALUES
-- AGENDAMENTO
('Agendar: Marcar Consulta', ARRAY['marcar', 'agendar', 'consulta', 'disponível', 'horário', 'queria', 'quero'], 'Para marcar uma consulta, preciso saber: 1) Qual especialidade? 2) Qual médico preference? 3) Preferência de dia/horário? 4) Convênio ou particular? Verifico disponibilidade e já reservo o melhor slot.', 1),
('Agendar: Primeira Vez', ARRAY['primeira', 'vez', 'novo', 'nunca', 'início', 'primeiro'], 'Ótimo ter você conosco! Primeira consulta é super tranquila. Precisamos de: RG, CPF, comprovante de residência e cartão do convênio (se tiver). Duração média de 40 minutos. Chegue 15 antes. 😊', 1),
('Agendar: Retorno', ARRAY['retorno', 'voltar', 'revisão', 'check-up', 'seguimento'], 'Para retorno, preciso do nome do médico que te atendeu e a data da última consulta. Geralmente o intervalo é 30-60 dias. Qual médico?', 1),
('Agendar: Urgência', ARRAY['urgência', 'urgente', 'agora', 'imediatamente', 'emergência'], 'Entendo a urgência! Para casos urgentes você tem duas opções: 1) Nosso horário de prioridade (mesmo dia). 2) Procurar um pronto-socorro se for muito grave. O que está sentindo?', 3),

-- REAGENDAMENTO
('Reagendar: Solicitar', ARRAY['reagendar', 'mudar', 'alterar', 'outro dia', 'outro horário', 'não posso'], 'Sem problema! A vida acontece. 😊 Qual dia e horário funciona melhor para você? Assim que remarcar, a gente confirma a vaga.', 1),
('Reagendar: Mesmo Médico', ARRAY['mesmo médico', 'mesmo doutor', 'preferência', 'doutor'], 'Claro! Qual horário prefere com o Dr(a). [NOME_MEDICO]? Tenho disponíveis em [DIAS].', 1),

-- CANCELAMENTO
('Cancelar: Solicitar', ARRAY['cancelar', 'desmarcar', 'não vou', 'impossível', 'cANCELAR'], 'Entendo que algo surgiu. Para cancelar, preciso que me avise com pelo menos 24h de antecedência para liberar a vaga. Quer realmente cancelar ou prefere reagendar?', 1),
('Cancelar: Doente', ARRAY['doente', 'enfermo', 'mal', 'gripado', 'doente'], 'Nossa! Espero que melhore logo! 🙏 Que tal reagendar para quando estiver se sentindo melhor? Assim que melhorar, é só chamar que encontramos a melhor data.', 1),
('Cancelar: Sem Taxa', ARRAY['grátis', 'sem custo', 'isenção', 'não cobrar'], 'Sem custo até 24h antes da consulta. Após isso, temos uma taxa de R$50 para cobrir nossa estrutura. Mas se reagendar, não cobramos nada! 😊', 2),

-- HORÁRIOS DISPONÍVEIS
('Horários: Verificar', ARRAY['disponível', 'vagas', 'horários', 'tem hora', 'quais dias'], 'Deixa eu verificar a agenda... Tenemos disponibilidade em [DIAS]. Qual horário funciona melhor - manhã, tarde ou noite?', 1),
('Horários: Manhã', ARRAY['manhã', 'cedinho', 'antes meio dia', '8h', '9h', '10h', '11h'], 'Ótimo! Pela manhã temos das 8h às 12h. Qual horário prefere? Tem disponível [HORÁRIOS].', 1),
('Horários: Tarde', ARRAY['tarde', 'depois meio dia', '14h', '15h', '16h', '17h'], 'Na parte da tarde temos das 14h às 18h. Qual horário prefere? Tem disponível [HORÁRIOS].', 1),

-- CONFIRMAÇÃO
('Confirmar: Consulta', ARRAY['confirmar', 'sim', 'estou indo', 'confirmado', 'vou sim'], 'Perfeito! Sua consulta está confirmada. 😊 \n\n📅 Data: [DATA]\n⏰ Horário: [HORA]\n👨‍⚕️ Médico: [MEDICO]\n📍 Local: [ENDERECO]\n\nTe vemos lá! Se precisar cancelar, avise com antecedência.', 1),
('Confirmar: Lembretes', ARRAY['lembrete', 'lembrar', 'avisa', 'não esquece', 'lembrar'], ' Pode ficar tranquilo(a)! Enviamos lembretes 24h antes e 2h antes da sua consulta. Você também recebe por WhatsApp. 📱', 1),

-- NPS E FEEDBACK
('NPS: O que é', ARRAY['pesquisa', 'avaliação', 'opiniao', 'nota', 'nps', 'satisfação'], 'Após sua consulta, enviamos uma perguntinha rápida sobre sua experiência. Sua opinião é super importante para melhorarmos sempre! Leva menos de 1 minuto. 💜', 1),
('NPS: Reclamação', ARRAY['reclamação', 'problema', 'ruim', 'péssimo', 'insatisfeito', 'queixa'], 'Lamento que sua experiência não tenha sido perfeita. 😔 Sua opinião nos ajuda a melhorar. Pode me contar o que aconteceu? Vou registrar e nossa equipe vai entrar em contato.', 2),
('NPS: Elogio', ARRAY['elogio', 'ótimo', 'perfeito', 'maravilhoso', 'adorei', 'fantástico'], 'Que ótimo saber! 🥰 Fico muito feliz! Vou registrar seu elogio. Seu feedback ajuda nossa equipe a continuar entregando o melhor atendimento!', 1),

-- INFORMAÇÕES
('Info: Documentos', ARRAY['documentos', 'rg', 'cpf', 'carteirinha', 'preciso'], 'Para primeira consulta traga: RG ou CNH, CPF, comprovante de residência e cartão do convênio (se tiver). Para menores, responsável legal. 😊', 1),
('Info: Duração', ARRAY['duração', 'tempo', 'demora', 'quanto tempo'], 'A duração varia por especialidade: Clínico cerca 30min, Especialista 40min, Retorno 20min. Geralmente respeitamos o horário agendado.', 1),
('Info: Estacionamento', ARRAY['estacionamento', 'carro', 'vaga', 'grátis'], 'Sim! Temos estacionamento gratuito próprio. Vagas identificadas. Entrada fácil e segura.', 1),
('Info: Acompanhante', ARRAY['acompanhante', 'familia', 'amigo', 'pode levar'], 'Claro! Acompanhante é bem-vindo. Para crianças, é obrigatório o responsável. Para idosos, recomendamos. 😊', 1),

-- TRIAGEM BÁSICA
('Triagem: Sintomas', ARRAY['dor', 'sintoma', 'sentindo', 'mal'], 'Entendo sua preocupação. Para triagem básica: Dor forte no peito, falta de ar ou sangramento intenso = procure emergência (192). Outros sintomas = agende uma consulta para avaliação. O que está sentindo?', 3),
('Triagem: Febre', ARRAY['febre', 'temperatura', 'quente'], 'Febre acima de 38°C: tome dipirona/paracetamol, hidrate-se e descanse. Se durar mais de 3 dias ou tiver outros sintomas, procure atendimento.', 2),
('Triagem: Emergência', ARRAY['emergência', 'grave', 'grave', 'muito doente'], 'Se é emergência real (dor intensa, sangramento, falta de ar), chame o SAMU (192) ou vá ao pronto-socorro mais próximo. Sua saúde é prioridade!', 3);

-- ==========================================
-- 21. RESULTADO FINAL
-- ==========================================
SELECT 
    '✅ Schema Cortex Call - Sistema de Agendamento Completo!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tabelas;