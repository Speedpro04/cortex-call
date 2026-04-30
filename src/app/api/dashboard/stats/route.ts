import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');

    // Inicializar datas para filtros
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Executar chamadas em paralelo para performance
    const [
      patientsRes,
      riskPatientsRes,
      campaignsRes,
      todayAppointmentsRes,
      alertPatientsRes,
      npsDataRes
    ] = await Promise.all([
      // 1. Total de pacientes
      supabase.from('patients').select('*', { count: 'exact', head: true }).match(clinic_id ? { clinic_id } : {}),
      
      // 2. Pacientes em risco
      supabase.from('patients').select('*', { count: 'exact', head: true })
        .in('temperatura_lead', ['morno', 'frio', 'perdido'])
        .match(clinic_id ? { clinic_id } : {}),
      
      // 4. Campanhas enviadas este mês
      supabase.from('campaigns').select('enviados_count, convertidos_count')
        .gte('created_at', startOfMonth.toISOString())
        .match(clinic_id ? { clinic_id } : {}),
      
      // 5. Agendamentos de hoje
      supabase.from('appointments').select(`
        id, appointment_time, status, tipo, motivo,
        patients(nome_completo, telefone, temperatura_lead),
        specialists(nome, especialidade)
      `)
      .like('appointment_time', `${today}%`)
      .match(clinic_id ? { clinic_id } : {})
      .order('appointment_time', { ascending: true })
      .limit(20),
      
      // 6. Pacientes alertas (6+ meses sem retorno)
      supabase.from('patients').select('*', { count: 'exact', head: true })
        .lt('ultima_consulta', sixMonthsAgo.toISOString())
        .match(clinic_id ? { clinic_id } : {}),
      
      // 7. NPS stats
      supabase.from('nps_responses').select('score')
        .gte('created_at', startOfMonth.toISOString())
        .match(clinic_id ? { clinic_id } : {})
    ]);

    const totalPatients = patientsRes.count;
    const riskPatients = riskPatientsRes.count;
    const campaigns = campaignsRes.data;
    const todayAppointments = todayAppointmentsRes.data;
    const alertPatients = alertPatientsRes.count;
    const npsData = npsDataRes.data;

    // 3. Taxa de abandono
    const abandonRate = totalPatients && totalPatients > 0
      ? ((riskPatients || 0) / totalPatients * 100).toFixed(1)
      : '0.0';

    const totalSent = campaigns?.reduce((sum, c) => sum + (c.enviados_count || 0), 0) || 0;
    const totalRecovered = campaigns?.reduce((sum, c) => sum + (c.convertidos_count || 0), 0) || 0;

    const formatted = (todayAppointments || []).map((a: any) => ({
      id: a.id,
      name: a.patients?.nome_completo || 'Não identificado',
      proc: a.tipo?.toUpperCase() || 'CONSULTA',
      time: a.appointment_time?.split('T')[1]?.substring(0, 5) || '',
      risk: getRisk(a.patients?.temperatura_lead),
      status: a.status,
      doctor: a.specialists?.nome || 'A definir',
      specialty: a.specialists?.especialidade || '',
    }));

    const avgNps = npsData && npsData.length > 0
      ? (npsData.reduce((sum, n) => sum + n.score, 0) / npsData.length).toFixed(1)
      : null;

    const avgConsultValue = 200; 
    const estimatedRevenue = totalRecovered * avgConsultValue;

    const recoveryRate = totalSent > 0
      ? Math.round((totalRecovered / totalSent) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        abandonRate: `${abandonRate}%`,
        totalSent: totalSent.toString(),
        totalRecovered: totalRecovered.toString(),
        estimatedRevenue: `R$ ${estimatedRevenue.toLocaleString('pt-BR')}`,
        recoveryRate: `${recoveryRate}%`,
        avgNps,
      },
      alertPatients: alertPatients || 0,
      appointments: formatted,
      totals: {
        patients: totalPatients || 0,
        riskPatients: riskPatients || 0,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getRisk(temperatura: string | null): string {
  switch (temperatura) {
    case 'perdido': return 'CRÍTICO';
    case 'frio': return 'ALTO';
    case 'morno': return 'MÉDIO';
    case 'novo': return 'BAIXO';
    case 'convertido': return 'BAIXO';
    default: return 'MÉDIO';
  }
}
