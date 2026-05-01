'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PremiumModal from '@/components/PremiumModal/PremiumModal';
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
      let clinicId = null;

      if (user) {
        // 1. Buscar Clínica do usuário
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id')
          .eq('user_id', user.id)
          .single();
        clinicId = clinic?.id;
      } else {
        // Master Bypass: pega a primeira clínica para visualização
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id')
          .limit(1)
          .single();
        clinicId = clinic?.id;
      }

      if (!clinicId) {
        setIsLoading(false);
        return;
      }

      // 2. Buscar Agendamentos
      const { data: apps } = await supabase
        .from('appointments')
        .select('*, patients(nome_completo), specialists(nome)')
        .eq('clinic_id', clinicId)
        .order('appointment_time', { ascending: true });

      // 3. Buscar Especialistas
      const { data: specs } = await supabase
        .from('specialists')
        .select('*')
        .eq('clinic_id', clinicId)
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
      let clinicId = null;

      if (user) {
        const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single();
        clinicId = clinic?.id;
      } else {
        const { data: clinic } = await supabase.from('clinics').select('id').limit(1).single();
        clinicId = clinic?.id;
      }

      const { error } = await supabase.from('appointments').insert({
        clinic_id: clinicId,
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

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Agendamento"
        subtitle="Preencha os dados da consulta"
      >
        <div className="modal-field">
          <label className="modal-label">Procedimento *</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Ex: Consulta, Exame, Retorno..."
            value={form.procedure}
            onChange={e => setForm({...form, procedure: e.target.value})}
          />
        </div>
        <div className="modal-grid-2">
          <div className="modal-field">
            <label className="modal-label">Horário *</label>
            <input
              type="time"
              className="modal-input"
              value={form.time}
              onChange={e => setForm({...form, time: e.target.value})}
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Valor (R$)</label>
            <input
              type="text"
              className="modal-input"
              placeholder="0,00"
              value={form.value}
              onChange={e => setForm({...form, value: e.target.value})}
            />
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Médico Responsável</label>
          <select
            className="modal-input"
            value={form.specialist_id}
            onChange={e => setForm({...form, specialist_id: e.target.value})}
          >
            <option value="">Selecione o especialista...</option>
            {specialists.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <button
          className="modal-btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRMAR AGENDAMENTO'}
        </button>
      </PremiumModal>
    </DashboardLayout>
  );
}
