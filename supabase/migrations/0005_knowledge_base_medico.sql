-- ==============================================================================
-- CORTEX CALL - KNOWLEDGE BASE RAG MÉDICO
-- Base de conhecimento para IA atender pacientes clínicos
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

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

INSERT INTO public.rag_knowledge_base (topic, keywords, context, priority_level) VALUES
-- TRIAGEM
('Triagem: Dor de Cabeça', ARRAY['dor', 'cabeça', 'enxaqueca', 'tensão', 'migranea'], 'Dor de cabeça pode ter várias causas: estresse, desidratação, sinusite, tensão muscular ou enxaqueca. Recomendamos repouso, hidratação e, se persistir por mais de 3 dias, procure um clínico geral.', 2),
('Triagem: Febre', ARRAY['febre', 'temperatura', 'infecção', 'gripe', 'coronavirus'], 'Febre é sinal de que seu corpo está combatendo uma infecção. Meça sua temperatura. Se estiver acima de 38°C, tome dipirona ou paracetamol, beba muitos líquidos e descanse. Procure atendimento se durar mais de 3 dias.', 3),
('Triagem: Tontura', ARRAY['tontura', 'tonto', 'vertigem', 'mareado', 'labirintite'], 'Tontura pode ser causada por hipoglicemia, problemas de pressão, labirintite ou desidratação. Sente-se imediatamente. Se acompanhada de visão dupla, fala difícil ou dor no peito, procure emergência.', 3),
('Triagem: Dor Abdominal', ARRAY['barriga', 'abdômen', 'estômago', 'gases', 'dor'], 'Dor abdominal pode ter várias causas. Observe: se a dor for intensa no lado direito inferior, pode ser apendicite - venha para avaliação. Evite alimentos pesados e mantenha-se hidratado.', 3),
('Triagem: Gripe e Resfriado', ARRAY['gripe', 'resfriado', 'tosse', 'coriza', 'dor garganta'], 'Gripe geralmente dura 5-7 dias. Sintomas: coriza, tosse, dor de garganta, fadiga. Recomendamos repouso, hidratação, vitamina C, paracetamol se febre. Se tiver dificuldade respiratória, procure um médico.', 2),
('Triagem: Dor de Garganta', ARRAY['garganta', 'engolir', 'amigdalite', 'rouquidão'], 'Dor de garganta pode ser viral ou bacteriana. Faça gargarejo com água morna e sal. Beba líquidos quentes com mel. Se tiver febre ou placas brancas, pode ser bacteriana - venha para avaliação.', 2),
('Triagem: Náusea e Vômito', ARRAY['náusea', 'vômito', 'enjoo', 'mal estar'], 'Náusea pode ser causada por alimentação, enxaqueca, labirintite ou gastrite. Evite comer por 2 horas, depois tome líquidos claros. Se o vômito persistir por mais de 24h ou tiver sangue, procure atendimento.', 2),
('Triagem: Dor nas Costas', ARRAY['costas', 'lombar', 'coluna', 'dor muscular'], 'Dor nas costas frequentemente causada por má postura, esforço físico, estresse ou problemas posturais. Aplique calor local, faça alongamentos leves, evite carregar peso. Se a dor irradiar para as pernas, procure um ortopedista.', 2),
('Triagem: Alergia', ARRAY['alergia', 'coceira', 'vermelhidão', 'pele', 'mancha'], 'Alergia pode ser ambiental, alimentar ou de pele. Identifique o agente causador. Anti-histamínicos podem ajudar. Se tiver inchaço na língua ou dificuldade respiratória, vá para emergência.', 3),
('Triagem: Pressão Alta', ARRAY['pressão', 'hipertensão', 'coração', 'sangue'], 'Hipertensão requer atenção. Fique calmo, evite sal e alimentos gordurosos. Se a pressão estiver acima de 180/120 com dor no peito ou visão embaçada, procure emergência imediatamente.', 3),
('Triagem: Diabetes', ARRAY['diabetes', 'açúcar', 'glicemia', 'insulina'], 'Para diabetes: tome seus medicamentos conforme prescrito, evite açúcares simples, hidrate-se bem. Se tiver sede excessiva, visão embaçada ou fadiga, pode ser descompensação. Procure seu endocrinologista.', 3),
('Triagem: Ansiedade', ARRAY['ansiedade', 'estresse', 'pânico', 'nervosismo'], 'Ansiedade se manifesta como preocupação excessiva, coração acelerado, tremores. Técnicas: respiração profunda, exercício físico, evitar cafeína. Se tiver ataques de pânico frequentes, um psiquiatra pode ajudar.', 1),
('Triagem: Insônia', ARRAY['insônia', 'dormir', 'sono', 'noite'], 'Insônia pode ser causada por estresse, cafeína ou rotina irregular. Dicas: evite telas 1h antes, crie rotina noturna, quarto escuro. Se persistir por mais de 2 semanas, procure um especialista.', 1),
('Triagem: Dor no Peito', ARRAY['peito', 'coração', 'dor', 'soco'], 'Dor no peito é sempre preocupante. Se for intensa, irradiar para braço/mandíbula, com suor ou falta de ar, CHAME EMERGÊNCIA (192). Pode ser problema cardíaco.', 3),
('Triagem: Fadiga e Cansaço', ARRAY['cansaço', 'fadiga', 'esgotamento', 'sem energia'], 'Fadiga pode ter muitas causas: anemia, hipotireoidismo, depressão, falta de sono. Faça exames de sangue gerais. Se acompanhado de febre ou perda de peso, procure médico.', 2),
-- AGENDAMENTO
('Agendamento: Marcar Consulta', ARRAY['marcar', 'agendar', 'consulta', 'disponível', 'horário'], 'Para marcar uma consulta, preciso saber: 1) Qual especialidade você precisa? 2) Tem preferência de dia ou horário? 3) É consulta particular ou convênio? Me envie essas informações e verifico a disponibilidade.', 1),
('Agendamento: Primeira Vez', ARRAY['primeira', 'vez', 'novo', 'paciente', 'início'], 'Primeira vez conosco! Precisamos de: RG, CPF, comprovante de residência e cartão do convênio (se tiver). O horário médio é 40 minutos. Chegue 15 minutos antes. Quer agendar?', 1),
('Agendamento: Retorno', ARRAY['retorno', 'voltar', 'seguimento', 'revisão'], 'Para retorno, preciso do nome do médico que te atendeu e da data do último atendimento. Geralmente o retorno é em 30 dias. Qual médico te atendeu?', 1),
('Agendamento: Convênio', ARRAY['convênio', 'plano', 'saúde', 'unimed', 'bradesco'], 'Trabalhamos com diversos convênios. Qual é o seu convênio? Posso verificar a cobertura e horários disponíveis para você.', 1),
('Agendamento: Particular', ARRAY['particular', 'dinheiro', 'valor', 'preço', 'quanto custa'], 'Valores particulares: Clínico R$150, Especialista R$200, Retorno R$100. Aceitamos cartão em até 12x. Quer agendar?', 1),
('Agendamento: Urgência', ARRAY['emergência', 'urgente', 'grave', 'agora'], 'Se é emergência, você tem duas opções: 1) Nosso horário de urgência (R$200 adicional). 2) Procure um pronto-socorro. Qual é a situação?', 3),
('Agendamento: Documentos', ARRAY['documentos', 'rg', 'cpf', 'carteirinha', 'comprovante'], 'Documentos necessários: RG ou CNH, CPF, cartão do convênio (se tiver), lista de medicamentos atuais. Para menores, responsável legal.', 1),
('Agendamento: Horário', ARRAY['horário', 'funcionamento', 'aberto', 'fecha', 'atendimento'], 'Funcionamos de segunda a sexta das 7h às 19h, sábado das 8h às 13h. Fechamos domingo e feriados. Quer agendar?', 1),
-- ESPECIALIDADES
('Especialidades: Clínico Geral', ARRAY['clínico', 'geral', 'clínica', 'básico'], 'O clínico geral é o primeiro ponto de contato. Trata diversas condições e pode te encaminhar para especialistas quando necessário. Qual é o seu objetivo?', 1),
('Especialidades: Cardiologia', ARRAY['cardiologista', 'coração', 'cardio', 'exame coração'], 'Nosso cardiologista realiza consultas, exames e acompanhamento de doenças cardíacas. Se tem histórico familiar ou sintomas, é importante uma avaliação.', 1),
('Especialidades: Dermatologia', ARRAY['dermatologista', 'pele', 'pele', 'cabelo', 'unha'], 'Dermatologista trata doenças da pele, cabelo e unhas. também estética facial. Qual é a sua necessidade - clínica ou estética?', 1),
('Especialidades: Ginecologia', ARRAY['ginecologista', 'gineco', 'mulher', 'preventivo'], 'Ginecologista cuida da saúde da mulher, prevenção, pré-natal e métodos contraceptivos. Atendemos de forma acolhedora.', 1),
('Especialidades: Ortopedia', ARRAY['ortopedista', 'osso', 'joelho', 'coluna', 'muscular'], 'Ortopedia trata problemas ósseos, musculares e articulares. Joelho, coluna, ombro, quadril - somos especializados.', 1),
('Especialidades: Pediatria', ARRAY['pediatra', 'criança', 'bebê', 'infantil', 'adolescente'], 'Pediatra atende crianças de 0 a 12 anos. Cuida do desenvolvimento, vaccinations e doenças infantis. Qual a idade da criança?', 1),
('Especialidades: Psiquiatria', ARRAY['psiquiatra', 'mental', 'psicológico', 'depressão'], 'Psiquiatra trata transtornos mentais com abordagem medicamentosa. Se necesita ajuda profissional, estamos aqui.', 1),
('Especialidades: Endocrinologia', ARRAY['endocrinologista', 'hormônio', 'tireoide', 'diabetes'], 'Endocrinologista trata hormônios, tireoide, diabetes, obesidade e metabolismo. Temos especialistas experientes.', 1),
-- RESULTADOS
('Resultados: Exames', ARRAY['resultado', 'exame', 'pronto', 'laudo'], 'Seus resultados ficaram prontos! Você pode buscar pessoalmente ou recebê-los por email. Para resultados online, acesse nosso portal do paciente. Qual prefere?', 1),
('Resultados: Sangue', ARRAY['sangue', 'hemograma', 'glicemia', 'exame sangue'], 'Exames de sangue ficam prontos em 24-48h úteis. Alguns específicos podem levar até 5 dias. Você receberá SMS quando estiver pronto.', 1),
('Resultados: Imagem', ARRAY['raio', 'ultrassom', 'tomografia', 'ressonância'], 'Exames de imagem ficam prontos em 3-5 dias úteis. Você pode buscar ou receber por email. O médico solicitante já tem acesso.', 1),
('Resultados: Prazo', ARRAY['prazo', 'demora', 'quando fica'], 'Prazo padrão: sangue 24-48h, urina 48h, imagem 3-5 dias. Feriados podem alterar. Você fez o exame quando?', 1),
-- FINANCEIRO
('Financeiro: Pagamento', ARRAY['pagar', 'dinheiro', 'cartão', 'pix', 'valor'], 'Aceitamos: dinheiro, cartão (débito/crédito), PIX, transferência. Parcelamos em até 12x no cartão. Como prefere pagar?', 1),
('Financeiro: Convênio', ARRAY['convênio', 'cobertura', 'plano', 'coparticipação'], 'Cobertura do convênio depende do seu plano. Alguns procedimentos têm coparticipação. Posso verificar a cobertura se me passar o nome do convênio.', 1),
('Financeiro: Boleto', ARRAY['boleto', 'pagamento', 'dia'], 'Seu boleto pode ser enviado por email ou gerado no portal. Preferência: email ou portal?', 1),
('Financeiro: Parcelamento', ARRAY['parcelar', 'parcelas', '12x'], 'Parcelamos em até 12x no cartão de crédito. No dinheiro ou pix tem 10% de desconto. Quer parcelar em quantas vezes?', 1),
-- INFORMAÇÕES
('Informações: Localização', ARRAY['endereço', 'rua', 'local', 'chegar', 'estacionamento'], 'Estamos localizados em local de fácil acesso. Estacionamento próprio gratuito. Waze/Google Maps: buscamos o melhor caminho para você.', 1),
('Informações: Estacionamento', ARRAY['estacionamento', 'carro', 'vaga', 'grátis'], 'Sim! Estacionamento próprio gratuito para pacientes. Vagas identificadas. Entrada facilitada.', 1),
('Informações: Acessibilidade', ARRAY['acessibilidade', 'deficiente', 'cadeira', 'elevador'], 'Sim! Prédio com elevador, rampas e banheiros adaptados. Acesso para cadeirantes. Tudo no mesmo andar.', 1),
('Informações: WIFI', ARRAY['wifi', 'internet', 'rede'], 'Sim! WiFi gratuito para pacientes. Rede disponível na recepção. Internet rápida para sua comodidad.', 1),
('Informações: Estrutura', ARRAY['estrutura', 'ambiente', 'consultório'], 'Nossa clínica tem: recepção confortável, salas climatizadas, consultórios modernos e equipe acolhedora. Tudo em um só lugar.', 1);

SELECT 'Knowledge base m��dico criada com ' || COUNT(*) || ' frases' as resultado FROM rag_knowledge_base;