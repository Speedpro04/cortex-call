import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');
    const date = searchParams.get('date');
    const specialist_id = searchParams.get('specialist_id');

    if (!clinic_id) {
      return NextResponse.json({ success: false, error: 'clinic_id é obrigatório' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients(nome_completo, telefone),
        specialists(nome, especialidade)
      `)
      .eq('clinic_id', clinic_id)
      .order('appointment_time', { ascending: true });

    if (date) {
      query = query.like('appointment_time', `${date}%`);
    }

    if (specialist_id) {
      query = query.eq('specialist_id', specialist_id);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    const formatted = (appointments || []).map((a) => ({
      id: a.id,
      patient: a.patients?.nome_completo || 'Não identificado',
      patient_phone: a.patients?.telefone || '',
      patient_id: a.patient_id,
      doctor: a.specialists?.nome || 'A definir',
      specialty: a.specialists?.especialidade || '',
      date: a.appointment_time?.split('T')[0] || '',
      time: a.appointment_time?.split('T')[1]?.substring(0, 5) || '',
      status: a.status,
      tipo: a.tipo,
      motivo: a.motivo || '',
      valor: a.valor || 0,
      paid: a.paid || false,
      nps_score: a.nps_score,
    }));

    return NextResponse.json({ success: true, appointments: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { clinic_id, patient_id, specialist_id, appointment_time, tipo, motivo, valor } = body;

    if (!clinic_id || !patient_id || !specialist_id || !appointment_time) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verificar conflito
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('specialist_id', specialist_id)
      .eq('appointment_time', appointment_time)
      .eq('status', 'scheduled')
      .single();

    if (conflict) {
      return NextResponse.json({ success: false, error: 'Horário já ocupado' }, { status: 400 });
    }

    // Buscar duração do médico
    const { data: specialist } = await supabase
      .from('specialists')
      .select('duracao_consulta')
      .eq('id', specialist_id)
      .single();

    const duration = specialist?.duracao_consulta || 30;
    const startTime = new Date(appointment_time);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        clinic_id,
        patient_id,
        specialist_id,
        appointment_time,
        appointment_end_time: endTime.toISOString(),
        tipo: tipo || 'consulta',
        status: 'scheduled',
        motivo,
        valor: valor || 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Atualizar temperatura do paciente
    await supabase
      .from('patients')
      .update({
        temperatura_lead: 'morno',
        proxima_consulta: appointment_time
      })
      .eq('id', patient_id);

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}