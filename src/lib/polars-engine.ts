/**
 * Motor de Inteligência para o Solara Connect
 * Processamento de dados de leads, pacientes e financeiro.
 * (Implementação leve sem dependência nativa nodejs-polars)
 */
export class PolarsEngine {
  /**
   * Analisa a conversão de leads e retorna insights estatísticos
   * @param leads Array de objetos de leads
   */
  static analyzeLeads(leads: any[]) {
    if (!leads.length) return null;

    // Agrupa por status e calcula estatísticas
    const grouped: Record<string, { total: number; scores: number[] }> = {};

    for (const lead of leads) {
      const status = lead.status || 'unknown';
      if (!grouped[status]) {
        grouped[status] = { total: 0, scores: [] };
      }
      grouped[status].total++;
      if (lead.score !== undefined) {
        grouped[status].scores.push(lead.score);
      }
    }

    return Object.entries(grouped)
      .map(([status, data]) => ({
        status,
        total: data.total,
        media_pontuacao: data.scores.length
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Identifica tendências de inadimplência ou cancelamento (Churn)
   */
  static detectChurnTrends(appointments: any[]) {
    // Filtra faltas e agrupa por paciente
    const faltasPorPaciente: Record<string, number> = {};

    for (const appt of appointments) {
      if (appt.status === 'faltou') {
        const pid = appt.paciente_id;
        faltasPorPaciente[pid] = (faltasPorPaciente[pid] || 0) + 1;
      }
    }

    return Object.entries(faltasPorPaciente)
      .filter(([, faltas]) => faltas > 2)
      .map(([paciente_id, faltas]) => ({ paciente_id, faltas }));
  }

  /**
   * Prepara o contexto para a IA (Gemini) resumindo os dados
   */
  static prepareAIContext(history: any[]) {
    // Ordena por data e pega os 10 mais recentes
    const sorted = [...history]
      .sort((a, b) => {
        const dateA = new Date(a.data || 0).getTime();
        const dateB = new Date(b.data || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    return sorted.map(item => ({
      data: item.data,
      tipo: item.tipo,
      resumo: item.resumo,
    }));
  }
}
