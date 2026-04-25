import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');

    let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    
    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }
    
    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ success: true, campaigns: [] });
    }

    const formattedCampaigns = campaigns.map(c => ({
      id: c.id,
      name: c.nome,
      status: c.status === 'active' ? 'ATIVA' : c.status === 'paused' ? 'PAUSADA' : 'CONCLUÍDA',
      canal: 'WhatsApp',
      patients: c.pacientes_count || 0,
      sent: c.enviados_count || 0,
      returned: c.convertidos_count || 0,
      rate: c.pacientes_count > 0 ? Math.round((c.convertidos_count / c.pacientes_count) * 100) + '%' : '0%',
      start: new Date(c.created_at).toLocaleDateString('pt-BR'),
      message: c.template_mensagem,
    }));

    return NextResponse.json({ success: true, campaigns: formattedCampaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = getServiceSupabase();
    
    let clinicId = payload.clinic_id;
    
    if (!clinicId) {
      const { data: c } = await supabase.from('clinics').select('id').limit(1).single();
      if (c) clinicId = c.id;
    }
    
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Nenhuma clínica encontrada.' }, { status: 400 });
    }

    const newCampaign = {
      clinic_id: clinicId,
      nome: payload.name || 'Nova Campanha Cortex',
      tipo: payload.tipo || 'recovery',
      status: 'active',
      template_mensagem: payload.message || 'Olá! Sentimos sua falta. Que tal agendar uma revisão?',
      pacientes_count: payload.patients_count || 10
    };

    const { data, error } = await supabase.from('campaigns').insert(newCampaign).select().single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, campaign: data });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}