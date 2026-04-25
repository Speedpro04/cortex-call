import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, getServiceSupabase } from './supabase';

const _apiKey = process.env.GEMINI_API_KEY || '';
const _genAI = _apiKey ? new GoogleGenerativeAI(_apiKey) : null;

export const retrieveContextFromDB = async (message: string) => {
  try {
    const { data, error } = await supabase.from('rag_knowledge_base').select('*');
    if (error || !data) return "";
    
    const normalized = message.toLowerCase();
    const matched = data.filter(e => e.keywords?.some((k: string) => normalized.includes(k.toLowerCase())));
    
    if (matched.length === 0) return "";
    return matched.map(t => `[TÓPICO: ${t.topic}]\nDIRETRIZ: ${t.context}`).join("\n\n");
  } catch (e) {
    return "";
  }
};

export const askCortexCallWithRAG = async (message: string) => {
  if (!_genAI) return "IA aguardando configuração de chave API Gemini.";

  const supabaseSvc = getServiceSupabase();
  let ragContext = "";

  try {
    const { data, error } = await supabaseSvc.from('rag_knowledge_base').select('*');
    if (!error && data) {
      const normalized = message.toLowerCase();
      const matched = data.filter(e => e.keywords?.some((k: string) => normalized.includes(k.toLowerCase())));
      if (matched.length > 0) {
        ragContext = matched.map(t => `[TÓPICO: ${t.topic}]\nDIRETRIZ: ${t.context}`).join("\n\n");
      }
    }
  } catch (err) {
    console.error("Erro RAG:", err);
  }

  try {
    const model = _genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Você é Cortex, a Inteligência Artificial de Elite do sistema Cortex Call para clínicas médicas.
Sua função é ser uma Estrategista de Negócios e Assistente Virtual de Altíssimo Nível para gestores de clínicas médicas.

DIRETRIZES DE PERSONALIDADE:
1. TOM EXECUTIVO & PREMIUM: Fale com clareza, autoridade e elegância. Use um tom de "Concierge de Negócios".
2. FOCO EM RESULTADOS: Suas respostas devem sempre visar o aumento do faturamento, a eficiência operacional ou a fidelização de pacientes.
3. PRECISÃO MÉDICA: Utilize terminologia técnica correta quando necessário, transparecendo domínio sobre a área médica.
4. PROATIVIDADE: Não apenas responda; se identificar um ponto de melhoria, sugira uma estratégia (ex: "Para melhorar a conversão deste lead, sugira aplicar o gatilho da escassez").
5. RESPOSTAS ESTRUTURADAS: Use bullets, negrito e parágrafos curtos para facilitar a leitura rápida do gestor.

COMO AGIR:
- Se houver contexto da BASE DE CONHECIMENTO (RAG), use-o como verdade absoluta para a clínica.
- Seja empática com as dores do gestor, mas sempre analítica.
- Nunca revele que você é um modelo de linguagem; você é o Cortex, o cérebro do sistema.

ESPECIALIDADES MÉDICAS QUE DEVO CONHECER: Clínico Geral, Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Psiquiatria, Endocrinologia, Neurologia, Oftalmologia.

Seu objetivo final: Transformar dados em lucro e gestão em excelência.`
    });

    const prompt = ragContext ? `BASE:\n${ragContext}\n\nPERGUNTA:\n${message}` : message;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Tive uma breve instabilidade neural, mas já estou aqui. Como posso ajudar?";
  }
};

export const generateRecoveryMessage = async (patientName: string, lastVisit: string) => {
  if (!_genAI) return `Olá ${patientName}! Notamos que faz tempo desde sua última consulta. Gostaria de agendar um retorno?`;

  try {
    const model = _genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Você é Cortex, assistente de clínicas médicas. Crie mensagens curtas e acolhedoras para WhatsApp, entre 1-2 parágrafos, convidando pacientes a retornarem para consultas. Use tom profissional mas amigável. Termine sempre com uma pergunta para engajar.`
    });

    const result = await model.generateContent(
      `Crie uma mensagem para o paciente ${patientName} que não visita a clínica desde ${lastVisit}. Convidando para um retorno preventivo.`
    );
    return result.response.text();
  } catch (error) {
    return `Olá ${patientName}! Sentimos sua falta. Que tal agendar uma revisão? 😊`;
  }
};

export const analyzePatientRisk = async (patientData: any) => {
  if (!_genAI) return { risk: 'MEDIO', suggestion: 'Contato preventivo' };

  try {
    const model = _genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Você é um analista de risco para clínicas médicas. Analise os dados do paciente e retorne um JSON com: risk (CRITICO/ALTO/MEDIO/BAIXO), reason (justificativa), suggestion (ação recomendada).`
    });

    const result = await model.generateContent(JSON.stringify(patientData));
    const text = result.response.text();
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, ''));
      return parsed;
    } catch {
      return { risk: 'MEDIO', reason: 'Análise padrão', suggestion: 'Contato preventivo' };
    }
  } catch (error) {
    return { risk: 'MEDIO', reason: 'Erro na análise', suggestion: 'Contato preventivo' };
  }
};