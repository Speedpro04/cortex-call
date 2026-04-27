import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { analyzePatientRisk } from '@/lib/gemini-rag';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');

    let query = supabase
      .from('patients')
      .select('*')
      .in('temperatura_lead', ['morno', 'frio', 'perdido'])
      .order('ultima_consulta', { ascending: true, nullsFirst: false });
      
    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }
      
    const { data: patients, error } = await query.limit(20);

    if (error) throw error;

    const processedPatients = await Promise.all(patients.map(async (p) => {
      const riskAnalysis = await analyzePatientRisk({
        nome: p.nome_completo,
        temperatura: p.temperatura_lead,
        ultima_consulta: p.ultima_consulta,
        origem: p.origem,
      });

      return {
        id: p.id,
        name: p.nome_completo || 'Sem Nome',
        phone: p.telefone,
        lastVisit: p.ultima_consulta ? new Date(p.ultima_consulta).toLocaleDateString('pt-BR') : 'Nunca',
        reason: p.temperatura_lead.toUpperCase(),
        score: riskAnalysis.risk || 'MEDIO',
        canal: 'WhatsApp',
        suggestion: riskAnalysis.suggestion || 'Contato preventivo',
        lastContact: new Date(p.updated_at).toLocaleDateString('pt-BR')
      };
    }));

    // Calcular stats reais
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .match(clinic_id ? { clinic_id } : {});

    const { count: riskPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .in('temperatura_lead', ['morno', 'frio', 'perdido'])
      .match(clinic_id ? { clinic_id } : {});

    const abandonRate = totalPatients && totalPatients > 0
      ? ((riskPatients || 0) / totalPatients * 100).toFixed(1)
      : '0.0';

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('enviados_count, convertidos_count')
      .gte('created_at', startOfMonth.toISOString())
      .match(clinic_id ? { clinic_id } : {});

    const totalSent = campaigns?.reduce((sum, c) => sum + (c.enviados_count || 0), 0) || 0;
    const totalRecovered = campaigns?.reduce((sum, c) => sum + (c.convertidos_count || 0), 0) || 0;
    const estimatedRevenue = totalRecovered * 200; // R$200 média por consulta

    const stats = [
      { label: 'TAXA DE ABANDONO', value: `${abandonRate}%`, color: 'orange' },
      { label: 'CONVITES ENVIADOS', value: totalSent.toString(), color: 'blue' },
      { label: 'PACIENTES RECUPERADOS', value: totalRecovered.toString(), color: 'green' },
      { label: 'FATURAMENTO RECUPERADO', value: `R$ ${estimatedRevenue.toLocaleString('pt-BR')}`, color: 'purple' },
    ];

    return NextResponse.json({ success: true, patients: processedPatients, stats });
  } catch (error: any) {
    console.error('Error fetching recovery patients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, patient_id, phone, clinic_id, patient_name } = await request.json();
    
    if (action === 'send_recovery_message') {
      const { generateRecoveryMessage } = await import('@/lib/gemini-rag');
      
      const messageContext = await generateRecoveryMessage(
        patient_name || 'Paciente',
        'sua última consulta'
      );
      
      let success = false;
      try {
        await sendWhatsAppMessage(phone, messageContext);
        success = true;
      } catch (evolErr) {
        console.error("Erro Evolution:", evolErr);
      }
      
      const supabase = getServiceSupabase();
      await supabase.from('ai_conversations').insert({
        clinic_id: clinic_id || null,
        patient_id: patient_id,
        telefone_remetente: phone,
        role: 'assistant',
        content: messageContext,
      });

      return NextResponse.json({ success: true, message: 'Mensagem enviada com sucesso!' });
    }
    
    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in recovery action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}