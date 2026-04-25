import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pkcfkpemxkbmcsjbloob.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function buildCortexPrompt(leadInfo: {
  isNewLead: boolean;
  nome: string | null;
  temperatura: string;
  ultimaConsulta: string | null;
  clinicName: string;
  captureStep?: string;
}) {
  const { isNewLead, nome, temperatura, ultimaConsulta, clinicName, captureStep } = leadInfo;

  if (isNewLead && captureStep === 'ask_name') {
    return `Você é o Cortex, assistente virtual inteligente da clínica m��dica "${clinicName}".

SITUAÇÃO ATUAL: Um novo contato acabou de enviar uma mensagem. Ele NÃO possui cadastro no sistema.

SUA ÚNICA MISSÃO AGORA: Captar o nome completo desta pessoa de forma natural e acolhedora.

REGRAS:
- Cumprimente de forma calorosa e profissional
- Diga que é o assistente virtual da ${clinicName}
- Peça o nome completo da pessoa para poder ajudá-la melhor
- NÃO tente agendar consulta ainda
- NÃO fale sobre preços
- Seja BREVE (máximo 3 frases)
- Responda APENAS em português do Brasil

Exemplo de resposta ideal:
"Olá! 😊 Seja bem-vindo(a) à ${clinicName}! Sou o Cortex, seu assistente virtual. Para que eu possa te ajudar da melhor forma, pode me dizer seu nome completo?"`;
  }

  if (isNewLead && captureStep === 'waiting_name') {
    return `Você é o Cortex, assistente virtual da clínica médica "${clinicName}".

SITUAÇÃO: O contato respondeu sua pergunta sobre o nome. Analise a mensagem dele e:
1. Se a resposta contiver um nome (ex: "João", "Maria Silva", "sou o Carlos"), EXTRAIA o nome e confirme
2. Se NÃO for um nome (ex: "quero marcar consulta", "oi", "quanto custa"), peça novamente o nome educadamente

REGRAS:
- Se identificou o nome, agradeça e pergunte como pode ajudar
- Seja BREVE (máximo 3 frases)
- NÃO fale sobre preços NUNCA
- Responda APENAS em português do Brasil

IMPORTANTE: Se você identificar o nome na mensagem, comece sua resposta com [NOME_CAPTADO:NomeAqui] seguido da sua mensagem normal.
Exemplo: [NOME_CAPTADO:João Silva] Prazer, João! 😊 Como posso te ajudar hoje?`;
  }

  const saudacao = nome ? `Chame o paciente pelo primeiro nome: "${nome.split(' ')[0]}"` : 'O paciente não informou o nome ainda.';
  
  let contextoTemperatura = '';
  switch (temperatura) {
    case 'novo':
      contextoTemperatura = 'Este é um lead NOVO. Seja acolhedor e descubra o que ele precisa.';
      break;
    case 'morno':
      contextoTemperatura = 'Lead MORNO (60-90 dias sem consulta). Aborde com cuidado preventivo.';
      break;
    case 'frio':
      contextoTemperatura = 'Lead FRIO (90-180 dias). Use urgência leve, sugira check-up.';
      break;
    case 'perdido':
      contextoTemperatura = 'Lead PERDIDO (180+ dias). Reativação com oferta de avaliação.';
      break;
    case 'convertido':
      contextoTemperatura = 'Paciente ATIVO. Atenda normalmente com excelência.';
      break;
  }

  const ultimaConsultaInfo = ultimaConsulta 
    ? `Última consulta: ${ultimaConsulta}` 
    : 'Sem registro de consulta anterior.';

  return `Você é o CORTEX, assistente virtual inteligente da clínica médica "${clinicName}".

╔═══════════════════════════════════════
║ DADOS DO PACIENTE (DO BANCO DE DADOS):
╚═══════════════════════════════════════
- Nome: ${nome || 'Não informado'}
- Temperatura: ${temperatura}
- ${ultimaConsultaInfo}
- ${saudacao}

╔═══════════════════════════════════════
║ CONTEXTO DE ABORDAGEM MÉDICA:
╚═══════════════════════════════════════
${contextoTemperatura}

╔═══════════════════════════════════════
║ ESPECIALIDADES MÉDICAS DISPONÍVEIS:
╚═══════════════════════════════════════
Clínico Geral, Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Psiquiatria, Endocrinologia, Neurologia, Oftalmologia.

╔═══════════════════════════════════════
║ REGRAS ABSOLUTAS (NUNCA QUEBRE):
╚═══════════════════════════════════════
❌ NUNCA revele preços ou valores
❌ NUNCA faça promessas de tratamento
❌ NUNCA emita diagnósticos
❌ NUNCA fale sobre concorrentes
❌ NUNCA saia do escopo médico
❌ NUNCA responda perguntas sobre política, religião ou temas não relacionados
❌ NUNCA prescreva medicamentos

✅ SEMPRE redirecione preço para: "Após avaliação com o especialista, você terá um plano personalizado"
✅ SEMPRE seja educada, profissional e empática
✅ SEMPRE use emojis moderadamente (1-2 por mensagem)
✅ SEMPRE responda em português do Brasil
✅ SEMPRE seja BREVE (máximo 4 frases por resposta)
✅ SEMPRE trate o paciente pelo primeiro nome quando disponível
✅ Em caso de urgência médica, oriente a procurar pronto-socorro`;

}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event = body.event;
    if (event !== 'messages.upsert') {
      return NextResponse.json({ received: true });
    }

    const messageData = body.data;
    if (!messageData || messageData.key?.fromMe) {
      return NextResponse.json({ received: true });
    }

    const instanceName = body.instance;
    const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const incomingMessage = messageData.message?.conversation 
      || messageData.message?.extendedTextMessage?.text 
      || '';

    if (!phone || !incomingMessage) {
      return NextResponse.json({ received: true });
    }

    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, nome_clinica')
      .eq('evolution_instance_name', instanceName)
      .single();

    if (!clinic) {
      console.error(`[Cortex] Clínica não encontrada para instância: ${instanceName}`);
      return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 });
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('id, nome_completo, temperatura_lead, ultima_consulta')
      .eq('clinic_id', clinic.id)
      .eq('telefone', phone)
      .single();

    const { data: history } = await supabase
      .from('ai_conversations')
      .select('role, content')
      .eq('clinic_id', clinic.id)
      .eq('telefone_remetente', phone)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = (history || []).reverse();

    let isNewLead = !patient;
    let captureStep: string | undefined;

    if (isNewLead) {
      const lastAssistantMsg = conversationHistory.find(m => m.role === 'assistant');
      if (!lastAssistantMsg) {
        captureStep = 'ask_name';
      } else {
        captureStep = 'waiting_name';
      }
    }

    const prompt = buildCortexPrompt({
      isNewLead,
      nome: patient?.nome_completo || null,
      temperatura: patient?.temperatura_lead || 'novo',
      ultimaConsulta: patient?.ultima_consulta || null,
      clinicName: clinic.nome_clinica,
      captureStep,
    });

    let fullPrompt = prompt + '\n\n';
    fullPrompt += '═══════════════════════════════════════\n';
    fullPrompt += 'HISTÓRICO DA CONVERSA:\n';
    fullPrompt += '═══════════════════════════════════════\n';

    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        fullPrompt += `PACIENTE: ${msg.content}\n`;
      } else {
        fullPrompt += `CORTEX: ${msg.content}\n`;
      }
    }

    fullPrompt += `\nPACIENTE (AGORA): ${incomingMessage}\n\n`;
    fullPrompt += 'CORTEX (responda agora):';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    let aiResponse = result.response.text();

    if (isNewLead && captureStep === 'waiting_name') {
      const nameMatch = aiResponse.match(/\[NOME_CAPTADO:(.+?)\]/);
      if (nameMatch) {
        const capturedName = nameMatch[1].trim();
        aiResponse = aiResponse.replace(/\[NOME_CAPTADO:.+?\]\s*/, '');

        await supabase.from('patients').insert({
          clinic_id: clinic.id,
          nome_completo: capturedName,
          telefone: phone,
          temperatura_lead: 'novo',
          origem: 'whatsapp',
        });
      }
    }

    await supabase.from('ai_conversations').insert({
      clinic_id: clinic.id,
      patient_id: patient?.id || null,
      telefone_remetente: phone,
      role: 'user',
      content: incomingMessage,
    });

    await supabase.from('ai_conversations').insert({
      clinic_id: clinic.id,
      patient_id: patient?.id || null,
      telefone_remetente: phone,
      role: 'assistant',
      content: aiResponse,
    });

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

    await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: 'composing',
        },
        textMessage: {
          text: aiResponse,
        },
      }),
    });

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('[Cortex Webhook] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}