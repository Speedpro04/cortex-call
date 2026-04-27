-- ==============================================================================
-- CORTEX CALL - SCHEMA COMPLETO PARA CLÍNICAS MÉDICAS
-- Multi-Tenant + RLS + Planos + WhatsApp + IA
-- Executar no Supabase SQL Editor
-- ==============================================================================

-- ==========================================
-- 1. EXTENSÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- 2. CLINICS (TENANT / INSTÂNCIA BASE)
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
-- 3. PLANS (PLANOS DISPONÍVEIS)
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
    ('2 Especialistas', 'plan-2-especialistas', 14700, 2, '["Até 2 Especialistas", "Cortex Call IA", "Otimização de Agenda", "Suporte WhatsApp"]'::jsonb),
    ('3 a 5 Especialistas', 'plan-3-5-especialistas', 25700, 5, '["Até 5 Especialistas", "Cortex Call Pro", "WhatsApp Ilimitado", "Suporte Prioritário"]'::jsonb),
    ('5 a 8 Especialistas', 'plan-5-8-especialistas', 36700, 8, '["Até 8 Especialistas", "Cortex Call Elite", "Gestor de Contas", "Integração Customizada"]'::jsonb);

-- ==========================================
-- 4. SUBSCRIPTIONS (ASSINATURAS)
-- ==========================================
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'expired', 'overdue');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status DEFAULT 'pending',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    pagbank_subscription_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_tenant_policy" ON public.subscriptions FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "subscriptions_service_policy" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 5. SPECIALISTS (ESPECIALISTAS/MÉDICOS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.specialists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    crm TEXT,
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialists_tenant_policy" ON public.specialists FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "specialists_service_policy" ON public.specialists FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 6. PATIENTS (PACIENTES POR CLÍNICA)
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
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_procedimento TEXT,
    observacoes TEXT,
    status appointment_status DEFAULT 'pending',
    lembrete_24h_enviado BOOLEAN DEFAULT FALSE,
    lembrete_2h_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_tenant_policy" ON public.appointments FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "appointments_service_policy" ON public.appointments FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 8. SPECIALIST_SCHEDULES (HORÁRIOS DE TRABALHO)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.specialist_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_tenant_policy" ON public.specialist_schedules FOR ALL USING (
    specialist_id IN (SELECT id FROM public.specialists WHERE clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()))
);

-- ==========================================
-- 9. CAMPAIGNS (CAMPANHAS DE RECUPERAÇÃO)
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
-- 10. CAMPAIGN_MESSAGES (MENSAGENS DA CAMPANHA)
-- ==========================================
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    telefone TEXT NOT NULL,
    message TEXT NOT NULL,
    status message_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_tenant_policy" ON public.campaign_messages FOR ALL USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()))
);

-- ==========================================
-- 11. AI_CONVERSATIONS (Logs do Agente IA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    telefone_remetente TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_tenant_policy" ON public.ai_conversations FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
);
CREATE POLICY "conversations_service_policy" ON public.ai_conversations FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 12. RAG_KNOWLEDGE_BASE (Base de Conhecimento IA)
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
-- 13. MASTER_EMAILS (Acesso Admin)
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
-- 14. FUNCTIONS E TRIGGERS
-- ==========================================

-- Limite de Especialistas por Plano
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
    WHERE s.clinic_id = NEW.clinic_id AND s.status = 'active';

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
    FOR EACH ROW EXECUTE FUNCTION check_specialist_limit();

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

-- Verificar conflito de agendamento
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE specialist_id = NEW.specialist_id
        AND appointment_time = NEW.appointment_time
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

-- ==========================================
-- 15. ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX idx_clinics_user ON public.clinics(user_id);
CREATE INDEX idx_subscriptions_clinic ON public.subscriptions(clinic_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_specialists_clinic ON public.specialists(clinic_id);
CREATE INDEX idx_specialists_schedule ON public.specialist_schedules(specialist_id, weekday);
CREATE INDEX idx_patients_telefone ON public.patients(telefone);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_patients_temperatura ON public.patients(temperatura_lead);
CREATE INDEX idx_patients_ultima ON public.patients(ultima_consulta);
CREATE INDEX idx_appointments_time ON public.appointments(appointment_time) WHERE status = 'pending';
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_campaigns_clinic ON public.campaigns(clinic_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_messages_campaign ON public.campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_patient ON public.campaign_messages(patient_id);
CREATE INDEX idx_conversations_clinic ON public.ai_conversations(clinic_id);
CREATE INDEX idx_conversations_patient ON public.ai_conversations(patient_id);
CREATE INDEX idx_plans_slug ON public.plans(slug);

-- ==========================================
-- 16. DADOS DA KNOWLEDGE BASE MÉDICA
-- ==========================================
INSERT INTO public.rag_knowledge_base (topic, keywords, context, priority_level) VALUES
-- TRIAGEM
('Triagem: Dor de Cabeça', ARRAY['dor', 'cabeça', 'enxaqueca', 'tensão', 'migranea'], 'Dor de cabeça pode ter várias causas: estresse, desidratação, sinusite, tensão muscular ou enxaqueca. Recomendamos repouso, hidratação e, se persistir por mais de 3 dias, procure um clínico geral.', 2),
('Triagem: Febre', ARRAY['febre', 'temperatura', 'infecção', 'gripe', 'coronavirus'], 'Febre é sinal de que seu corpo está combatendo uma infecção. Meça sua temperatura. Se estiver acima de 38°C, tome dipirona ou paracetamol, beba muitos líquidos e descanse. Procure atendimento se durar mais de 3 dias.', 3),
('Triagem: Tontura', ARRAY['tontura', 'tonto', 'vertigem', 'mareado', 'labirintite'], 'Tontura pode ser causada por hipoglicemia, problemas de pressão, labirintite ou desidratação. Sente-se imediatamente. Se acompanhada de visão dupla, fala difícil ou dor no peito, procure emergência.', 3),
('Triagem: Dor Abdominal', ARRAY['barriga', 'abdômen', 'estômago', 'gases', 'dor'], 'Dor abdominal pode ter várias causas. Observe: se a dor for intensa no lado direito inferior, pode ser apendicite - venha para avaliação. Evite alimentos pesados e mantenha-se hidratado.', 3),
('Triagem: Gripe e Resfriado', ARRAY['gripe', 'resfriado', 'tosse', 'coriza', 'dor garganta'], 'Gripe geralmente dura 5-7 dias. Sintomas: coriza, tosse, dor de garganta, fadiga. Recomendamos repouso, hidratação, vitamina C, paracetamol se febre.', 2),
('Triagem: Dor de Garganta', ARRAY['garganta', 'engolir', 'amigdalite', 'rouquidão'], 'Dor de garganta pode ser viral ou bacteriana. Faça gargarejo com água morna e sal. Beba líquidos quentes. Se tiver febre ou placas brancas, venha para avaliação.', 2),
('Triagem: Náusea e Vômito', ARRAY['náusea', 'vômito', 'enjoo', 'mal estar'], 'Náusea pode ser causada por alimentação, enxaqueca, labirintite ou gastrite. Evite comer por 2 horas, depois tome líquidos claros. Se o vômito persistir por mais de 24h, procure atendimento.', 2),
('Triagem: Dor nas Costas', ARRAY['costas', 'lombar', 'coluna', 'dor muscular'], 'Dor nas costas frequentemente causada por má postura, esforço físico, estresse ou problemas posturais. Aplique calor local, faça alongamentos leves. Se a dor irradiar para as pernas, procure um ortopedista.', 2),
('Triagem: Pressão Alta', ARRAY['pressão', 'hipertensão', 'coração', 'sangue'], 'Hipertensão requer atenção. Fique calmo, evite sal e alimentos gordurosos. Se a pressão estiver acima de 180/120 com dor no peito ou visão embaçada, procure emergência imediatamente.', 3),
('Triagem: Diabetes', ARRAY['diabetes', 'açúcar', 'glicemia', 'insulina'], 'Para diabetes: tome seus medicamentos conforme prescrito, evite açúcares simples, hidrate-se bem. Se tiver sede excessiva, visão embaçada ou fadiga, pode ser descompensação.', 3),
('Triagem: Ansiedade', ARRAY['ansiedade', 'estresse', 'pânico', 'nervosismo'], 'Ansiedade se manifesta como preocupação excessiva, coração acelerado, tremores. Técnicas: respiração profunda, exercício físico, evitar cafeína.', 1),
('Triagem: Insônia', ARRAY['insônia', 'dormir', 'sono', 'noite'], 'Insônia pode ser causada por estresse, cafeína ou rotina irregular. Dicas: evite telas 1h antes, crie rotina noturna. Se persistir por mais de 2 semanas, procure um especialista.', 1),
('Triagem: Dor no Peito', ARRAY['peito', 'coração', 'dor'], 'Dor no peito é sempre preocupante. Se for intensa, irradiar para braço/mandíbula, com suor ou falta de ar, CHAME EMERGÊNCIA (192). Pode ser problema cardíaco.', 3),
('Triagem: Fadiga e Cansaço', ARRAY['cansaço', 'fadiga', 'esgotamento', 'sem energia'], 'Fadiga pode ter muitas causas: anemia, hipotireoidismo, depressão, falta de sono. Faça exames de sangue gerais.', 2),
-- AGENDAMENTO
('Agendamento: Marcar Consulta', ARRAY['marcar', 'agendar', 'consulta', 'disponível', 'horário'], 'Para marcar uma consulta, preciso saber: 1) Qual especialidade você precisa? 2) Tem preferência de dia ou horário? 3) É consulta particular ou convênio?', 1),
('Agendamento: Primeira Vez', ARRAY['primeira', 'vez', 'novo', 'paciente', 'início'], 'Primeira vez conosco! Precisamos de: RG, CPF, comprovante de residência e cartão do convênio (se tiver). O horário médio é 40 minutos. Chegue 15 minutos antes.', 1),
('Agendamento: Retorno', ARRAY['retorno', 'voltar', 'seguimento', 'revisão'], 'Para retorno, preciso do nome do médico que te atendeu e da data do último atendimento. Geralmente o retorno é em 30 dias.', 1),
('Agendamento: Convênio', ARRAY['convênio', 'plano', 'saúde', 'unimed', 'bradesco'], 'Trabalhamos com diversos convênios. Qual é o seu convênio? Posso verificar a cobertura e horários disponíveis.', 1),
('Agendamento: Particular', ARRAY['particular', 'dinheiro', 'valor', 'preço', 'quanto custa'], 'Valores particulares: Clínico R$150, Especialista R$200, Retorno R$100. Aceitamos cartão em até 12x.', 1),
('Agendamento: Urgência', ARRAY['emergência', 'urgente', 'grave', 'agora'], 'Se é emergência, você tem duas opções: 1) Nosso horário de urgência (R$200 adicional). 2) Procure um pronto-socorro.', 3),
('Agendamento: Documentos', ARRAY['documentos', 'rg', 'cpf', 'carteirinha', 'comprovante'], 'Documentos necessários: RG ou CNH, CPF, cartão do convênio (se tiver), lista de medicamentos atuais. Para menores, responsável legal.', 1),
('Agendamento: Horário', ARRAY['horário', 'funcionamento', 'aberto', 'fecha', 'atendimento'], 'Funcionamos de segunda a sexta das 7h às 19h, sábado das 8h às 13h. Fechamos domingo e feriados.', 1),
-- ESPECIALIDADES
('Especialidades: Clínico Geral', ARRAY['clínico', 'geral', 'clínica', 'básico'], 'O clínico geral é o primeiro ponto de contato. Trata diversas condições e pode te encaminhar para especialistas quando necessário.', 1),
('Especialidades: Cardiologia', ARRAY['cardiologista', 'coração', 'cardio', 'exame coração'], 'Nosso cardiologista realiza consultas, exames e acompanhamento de doenças cardíacas.', 1),
('Especialidades: Dermatologia', ARRAY['dermatologista', 'pele', 'cabelo', 'unha'], 'Dermatologista trata doenças da pele, cabelo e unhas, além de estética facial.', 1),
('Especialidades: Ginecologia', ARRAY['ginecologista', 'gineco', 'mulher', 'preventivo'], 'Ginecologista cuida da saúde da mulher, prevenção, pré-natal e métodos contraceptivos.', 1),
('Especialidades: Ortopedia', ARRAY['ortopedista', 'osso', 'joelho', 'coluna', 'muscular'], 'Ortopedia trata problemas ósseos, musculares e articulares.', 1),
('Especialidades: Pediatria', ARRAY['pediatra', 'criança', 'bebê', 'infantil'], 'Pediatra atende crianças de 0 a 12 anos. Cuida do desenvolvimento, vacinações e doenças infantis.', 1),
('Especialidades: Psiquiatria', ARRAY['psiquiatra', 'mental', 'psicológico', 'depressão'], 'Psiquiatra trata transtornos mentais com abordagem medicamentosa.', 1),
('Especialidades: Endocrinologia', ARRAY['endocrinologista', 'hormônio', 'tireoide', 'diabetes'], 'Endocrinologista trata hormônios, tireoide, diabetes, obesidade e metabolismo.', 1),
-- RESULTADOS
('Resultados: Exames', ARRAY['resultado', 'exame', 'pronto', 'laudo'], 'Seus resultados ficaram prontos! Você pode buscar pessoalmente ou recebê-los por email. Para resultados online, acesse nosso portal.', 1),
('Resultados: Sangue', ARRAY['sangue', 'hemograma', 'glicemia', 'exame sangue'], 'Exames de sangue ficam prontos em 24-48h úteis. Alguns específicos podem levar até 5 dias. Você receberá SMS quando estiver pronto.', 1),
('Resultados: Imagem', ARRAY['raio', 'ultrassom', 'tomografia', 'ressonância'], 'Exames de imagem ficam prontos em 3-5 dias úteis. O médico solicitante já tem acesso.', 1),
-- FINANCEIRO
('Financeiro: Pagamento', ARRAY['pagar', 'dinheiro', 'cartão', 'pix', 'valor'], 'Aceitamos: dinheiro, cartão (débito/crédito), PIX, transferência. Parcelamos em até 12x no cartão.', 1),
('Financeiro: Convênio', ARRAY['convênio', 'cobertura', 'plano', 'coparticipação'], 'Cobertura do convênio depende do seu plano. Alguns procedimentos têm coparticipação.', 1),
('Financeiro: Boleto', ARRAY['boleto', 'pagamento'], 'Seu boleto pode ser enviado por email ou gerado no portal.', 1),
('Financeiro: Parcelamento', ARRAY['parcelar', 'parcelas', '12x'], 'Parcelamos em até 12x no cartão de crédito. No dinheiro ou pix tem 10% de desconto.', 1),
-- INFORMAÇÕES
('Informações: Localização', ARRAY['endereço', 'rua', 'local', 'chegar', 'estacionamento'], 'Estamos localizados em local de fácil acesso. Estacionamento próprio gratuito.', 1),
('Informações: Estacionamento', ARRAY['estacionamento', 'carro', 'vaga', 'grátis'], 'Sim! Estacionamento próprio gratuito para pacientes.', 1),
('Informações: Acessibilidade', ARRAY['acessibilidade', 'deficiente', 'cadeira', 'elevador'], 'Sim! Prédio com elevador, rampas e banheiros adaptados para cadeirantes.', 1),
('Informações: WIFI', ARRAY['wifi', 'internet', 'rede'], 'WiFi gratuito para pacientes. Rede disponível na recepção.', 1),
('Informações: Estrutura', ARRAY['estrutura', 'ambiente', 'consultório'], 'Nossa clínica tem: recepção confortável, salas climatizadas, consultórios modernos.', 1);

-- ==========================================
-- 17. CONFIRMAÇÃO
-- ==========================================
SELECT 
    'Schema Cortex Call criado com sucesso!' as status,
    (SELECT COUNT(*) FROM public.plans) as planos,
    (SELECT COUNT(*) FROM public.rag_knowledge_base) as frases_knowledge_base;