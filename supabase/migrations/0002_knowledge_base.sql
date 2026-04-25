-- Ativação da extensão pgvector para embeddings futuros no Supabase (se desejado)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela oficial de Knowledge Base RAG do Odonto Connect
CREATE TABLE IF NOT EXISTS public.rag_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    keywords TEXT[] NOT NULL,
    context TEXT NOT NULL,
    priority_level INT DEFAULT 1, -- 1-Normal, 2-Atenção, 3-Urgência (para Churn ou Dor)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativa RLS
ALTER TABLE public.rag_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso de leitura público para Inteligência"
    ON public.rag_knowledge_base FOR SELECT
    USING (true);

-- Injeção de dezenas de cenários diversificados
INSERT INTO public.rag_knowledge_base (topic, keywords, context, priority_level) VALUES
('Tratamento de Canal', ARRAY['canal', 'dor aguda', 'nervo', 'pulpite', 'latejando', 'neo endo', 'obturação canal'], 'Urgência clínica alta. Pulpite ou abscesso ativo. Focar no alívio imediato (pulpectomia) e prescrição médica. Prioridade máxima na agenda.', 3),
('Trauma e Fratura', ARRAY['quebrado', 'fraturado', 'lascou', 'trauma', 'batida', 'caiu restauração', 'coroa soltou'], 'Risco estético e de dor por dentina exposta. Agendar no mesmo dia para colar ou refazer resina/coroa.', 3),
('Cirurgia Siso', ARRAY['siso', 'terceiro molar', 'pericoronarite', 'inchaço', 'rosto inchado', 'sangramento gengiva siso'], 'Situação de dor, exodontia. Informar necessidade de panorâmica/tomografia. Garantir protocolo de touchpoints (24h/72h) de Recovery no pós-operatório.', 3),
('Prótese Dentária', ARRAY['prótese', 'coroa', 'ponte', 'dentadura', 'protocolo branemark', 'chapa', 'roach', 'pivô'], 'High-Ticket. Focar em estabilidade, estética e recuperação da função mastigatória. Upsell: Prótese flexível ou Implante Protocolo.', 1),
('Lentes e Estética', ARRAY['lente de contato', 'faceta', 'sorriso perfeito', 'diastema', 'porcelana', 'dente pequeno'], 'High-Ticket. Abordagem luxo. Focar em "Design Digital do Sorriso", transformação sem desgaste e harmonia orofacial.', 1),
('Aparelho Ortodôntico', ARRAY['aparelho', 'fixo', 'braquete', 'arame', 'borrachinha', 'manutenção', 'fio solto', 'machucando'], 'Recorrência. Alertar que faltar na manutenção atrasa o tratamento. Agendar com o foco de resolver o fio soltando se tiver machucando.', 2),
('Alinhadores (Invisalign)', ARRAY['invisalign', 'alinhador', 'transparente', 'clear correct', 'aparelho invisível', 'remoção placa'], 'High-Ticket. Foco em previsibilidade digital, estética premium e consultas rápidas sem machucar a boca.', 1),
('Limpeza (Profilaxia)', ARRAY['limpeza', 'profilaxia', 'tártaro', 'mancha dente', 'mau hálito', 'halitose', 'limpar sujeira'], 'Motor da clínica. Trazer o paciente demonstrando que a limpeza evita gengivite. Recomendação de 6 em 6 meses.', 1),
('Bruxismo (DTM)', ARRAY['bruxismo', 'apertamento', 'ranger dente', 'dor maxilar', 'atm', 'dor de cabeça', 'placa rígida'], 'Sintomas de estresse crônico. Indicar confecção de placa de mordida e possibilidade de Botox terapêutico no masseter.', 2),
('Harmonização HOF', ARRAY['botox', 'preenchimento', 'ácido hialurônico', 'fios pdo', 'bigode chinês', 'rugas', 'lipopapada'], 'Estética Facial Premium. Exigir do atendente uma venda do resultado natural, utilizando insumos topo de linha.', 1),
('Odontopediatria', ARRAY['criança', 'pediatra', 'dente leite', 'cárie bebê', 'choro', 'flúor criança', 'selante'], 'Empatia total. Condicionamento infantil. Acalmar os pais relatando que a clínica tem abordagem lúdica.', 1),
('Periodontia Avançada', ARRAY['periodontite', 'gengiva retraída', 'raiz exposta', 'amolecimento dente', 'sangramento agressivo'], 'Alerta grave de perda óssea. Requer raspagem profunda. Cuidado para não gerar pânico, mas não tratar como simples limpeza.', 2),
('Clareamento Dentário', ARRAY['clareamento', 'dente amarelo', 'laser', 'caseiro', 'moldeira clareamento', 'sorriso amarelo'], 'Serviço rápido. Upsell ideal logo após a limpeza. Informar sobre controle de sensibilidade para tranquilizar o lead.', 1),
('Disfunção e Estalos', ARRAY['boca travada', 'estalo ao abrir', 'dor ouvido', 'luxação atm', 'não consigo fechar a boca'], 'Emergência HOF/ATM. Precisa de avaliação maxilofacial com urgência para destravamento.', 3),
('Sensibilidade Térmica', ARRAY['gelado dói', 'quente dói', 'dente sensível', 'dor ao escovar', 'retração'], 'Sintoma clássico de cárie inicial ou desgaste por escovação forte. Agendar avaliação com laserterapia.', 2);
