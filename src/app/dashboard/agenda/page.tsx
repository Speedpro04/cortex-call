'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Search, ChevronDown, Plus, User, Stethoscope, Loader2, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import styles from './agenda.module.css';

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ patient_id: '', time: '', procedure: '', specialist_id: '', value: '' });

  // Mocks para slots disponíveis (num sistema real isso viria da grade horária)
  const slots = [
    { time: '09:30', doctor: 'DR. CARLOS MENDES', status: 'DISPONÍVEL' },
    { time: '13:00', doctor: 'DRA. ANA PAULA', status: 'DISPONÍVEL' },
    { time: '15:30', doctor: 'DR. CARLOS MENDES', status: 'DISPONÍVEL' },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Buscar Clínica
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!clinic) return;

      // 2. Buscar Agendamentos
      const { data: apps } = await supabase
        .from('appointments')
        .select('*, patients(nome_completo), specialists(nome)')
        .eq('clinic_id', clinic.id)
        .order('appointment_time', { ascending: true });

      // 3. Buscar Especialistas
      const { data: specs } = await supabase
        .from('specialists')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('ativo', true);

      setAppointments(apps || []);
      setSpecialists(specs || []);
    } catch (error) {
      console.error('Error fetching agenda:', error);
      toast.error('Erro ao carregar dados da agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!form.time || !form.procedure) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user?.id).single();

      const { error } = await supabase.from('appointments').insert({
        clinic_id: clinic?.id,
        patient_id: form.patient_id || null, // No mundo real, selecionaria um paciente
        specialist_id: form.specialist_id || null,
        appointment_time: new Date().toISOString().split('T')[0] + 'T' + form.time + ':00Z',
        tipo_procedimento: form.procedure,
        valor_procedimento: parseFloat(form.value.replace('R$', '').replace(',', '.')) || 0,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Agendamento realizado!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao agendar consulta.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div className={styles.titleInfo}>
            <h2>AGENDA</h2>
            <p>GERENCIE CONSULTAS E HORÁRIOS DISPONÍVEIS</p>
          </div>
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> NOVA CONSULTA
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <span>FILTROS:</span>
            <div className={styles.select}>
              {specialists.length > 0 ? 'FILTRAR POR MÉDICO' : 'TODOS OS MÉDICOS'} <ChevronDown size={14} />
            </div>
            <div className={styles.select}>
              TODOS OS PROCEDIMENTOS <ChevronDown size={14} />
            </div>
          </div>
          <div className={styles.searchBtn}>
            <Search size={18} />
          </div>
        </div>

        <div className={styles.agendaGrid}>
          {/* Main Column: Appointments */}
          <div className={styles.appointmentsCol}>
            <h3 className={styles.sectionTitle}>CONSULTAS AGENDADAS</h3>
            <div className={styles.list}>
              {isLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
              ) : appointments.length === 0 ? (
                <div className="text-center p-10 opacity-50 font-bold uppercase tracking-widest text-xs">Nenhum agendamento para hoje.</div>
              ) : (
                appointments.map((app) => (
                  <div key={app.id} className={styles.appointmentCard}>
                    <div className={styles.cardLeft}>
                      <div className={styles.statusBadge} data-color={app.status === 'confirmed' ? 'green' : 'orange'}>
                        {app.status === 'pending' ? 'AGUARDANDO' : app.status.toUpperCase()}
                      </div>
                      <div className={styles.timeInfo}>
                        <Clock size={14} /> <span>{formatTime(app.appointment_time)}</span>
                      </div>
                    </div>

                    <div className={styles.cardInfo}>
                      <h4>{app.patients?.nome_completo || 'Paciente não identificado'}</h4>
                      <p>{app.tipo_procedimento}</p>
                    </div>

                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <Stethoscope size={14} /> <span>{app.specialists?.nome || 'A definir'}</span>
                      </div>
                      <div className={styles.value}>R$ {app.valor_procedimento?.toFixed(2) || '---'}</div>
                    </div>

                    <button className={styles.detailsBtn}>DETALHES</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Column: Available Slots */}
          <div className={styles.slotsCol}>
            <h3 className={styles.sectionTitle}>HORÁRIOS DISPONÍVEIS (EXEMPLO)</h3>
            <div className={styles.list}>
              {slots.map((slot, i) => (
                <div key={i} className={styles.slotCard}>
                  <div className={styles.slotInfo}>
                    <strong>{slot.time}</strong>
                    <p>{slot.doctor}</p>
                  </div>
                  <button className={styles.preencherBtn} onClick={() => {
                    setForm({...form, time: slot.time});
                    setIsModalOpen(true);
                  }}>PREENCHER</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Consulta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#001f3f] mb-6 uppercase tracking-wider">Novo Agendamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Procedimento *</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="Ex: Consulta, Exame..."
                  value={form.procedure}
                  onChange={e => setForm({...form, procedure: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Horário *</label>
                  <input 
                    type="time" 
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all font-medium"
                    value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Valor (R$)</label>
                  <input 
                    type="text" 
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="0,00"
                    value={form.value}
                    onChange={e => setForm({...form, value: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Médico Responsável</label>
                <select 
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all font-medium bg-white"
                  value={form.specialist_id}
                  onChange={e => setForm({...form, specialist_id: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {specialists.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#001f3f] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-125 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRMAR AGENDAMENTO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
