const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || '';

/**
 * Envia mensagem de texto via WhatsApp (Evolution API)
 */
export async function sendWhatsAppMessage(phone: string, text: string) {
  const formattedPhone = phone.replace(/\D/g, '');

  if (!formattedPhone) {
    throw new Error('Telefone inválido.');
  }

  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: formattedPhone,
      options: {
        delay: 1200,
        presence: 'composing',
      },
      textMessage: {
        text: text,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Evolution API] Falha:', error);
    throw new Error(`Evolution API error: ${response.status}`);
  }

  return response.json();
}
