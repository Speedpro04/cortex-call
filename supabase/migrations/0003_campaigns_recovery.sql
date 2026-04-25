-- ==============================================================================
-- MIGRATION 0003: CAMPAIGNS & RECOVERY SYSTEM
-- O coração do Solara Connect - Recuperação Automática de Pacientes
-- ==============================================================================

-- Tabela de Campanhas de Recuperação
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'recovery', -- recovery, limpeza, estetica, custom
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed
    canal TEXT NOT NULL DEFAULT 'whatsapp',
    mensagem_template TEXT NOT NULL,
    filtro_temperatura TEXT[] DEFAULT ARRAY['frio', 'perdido'], -- quais temperaturas de lead atingir
    filtro_dias_sem_consulta INTEGER DEFAULT 90, -- pacientes sem consulta há X dias
    sequencia JSONB DEFAULT '[]'::jsonb, -- steps da campanha [{dia: 1, acao: "...", tipo: "whatsapp"}]
    total_pacientes INTEGER DEFAULT 0,
    total_enviados INTEGER DEFAULT 0,
    total_retornos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_tenant_policy" ON public.campaigns
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "campaigns_service_policy" ON public.campaigns
    FOR ALL USING (auth.role() = 'service_role');

-- Tabela de mensagens individuais enviadas por campanha
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    mensagem_enviada TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read, replied, failed
    step_number INTEGER DEFAULT 1,
    resposta_paciente TEXT,
    enviado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    respondido_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_messages_tenant_policy" ON public.campaign_messages
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

CREATE POLICY "campaign_messages_service_policy" ON public.campaign_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Índices de Performance
CREATE INDEX idx_campaigns_clinic ON public.campaigns(clinic_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_messages_campaign ON public.campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_patient ON public.campaign_messages(patient_id);
CREATE INDEX idx_campaign_messages_status ON public.campaign_messages(status);

-- Trigger updated_at para campaigns
CREATE TRIGGER trigger_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
