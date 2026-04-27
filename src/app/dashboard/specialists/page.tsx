'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PremiumModal from '@/components/PremiumModal/PremiumModal';
import { Stethoscope, Plus, MoreVertical, Edit2, Activity, Users, Sparkles, Loader2 } from 'lucide-react';
import styles from './specialists.module.css';

export default function SpecialistsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', especialidade: '', cro: '', telefone: '', email: '' });

  const specialists = [
    { id: 1, name: 'Dr. Roberto Cardoso', specialty: 'Cardiologia', status: 'ATIVO', patients: 142, rating: 4.9 },
    { id: 2, name: 'Dra. Mara Silveira', specialty: 'Dermatologia', status: 'ATIVO', patients: 98, rating: 4.8 },
    { id: 3, name: 'Dr. Henrique Neto', specialty: 'Clínico Geral', status: 'ATIVO', patients: 210, rating: 5.0 },
    { id: 4, name: 'Dra. Alice Ferreira', specialty: 'Pediatria', status: 'ATIVO', patients: 65, rating: 4.7 },
  ];

  const stats = [
    { label: 'TOTAL DOUTORES', value: '12', icon: <Stethoscope size={20} />, color: 'teal' },
    { label: 'ATIVOS HOJE', value: '8', icon: <Activity size={20} />, color: 'green' },
    { label: 'ESPECIALIDADES', value: '6', icon: <Users size={20} />, color: 'blue' },
    { label: 'AVALIAÇÃO MÉDIA', value: '4.9', icon: <Sparkles size={20} />, color: 'purple' },
  ];

  const handleSave = async () => {
    if (!form.nome || !form.especialidade) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ nome: '', especialidade: '', cro: '', telefone: '', email: '' });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <h2>ESPECIALISTAS</h2>
            <p>GESTÃO DE CORPO CLÍNICO E PERFORMANCE</p>
          </div>
          <button className={styles.newBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> NOVO ESPECIALISTA
          </button>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIcon} data-color={stat.color}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>CORPO CLÍNICO ATIVO</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NOME COMPLETO</th>
                  <th>ESPECIALIDADE</th>
                  <th>PACIENTES</th>
                  <th>AVALIAÇÃO</th>
                  <th>STATUS</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {specialists.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className={styles.specialistInfo}>
                        <strong>{s.name}</strong>
                        <span>CONSELHO: CRM-SP {12345 + s.id}</span>
                      </div>
                    </td>
                    <td>{s.specialty}</td>
                    <td>{s.patients}</td>
                    <td>⭐ {s.rating}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles.active}`}>{s.status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn}><Edit2 size={14} /></button>
                        <button className={styles.actionBtn}><MoreVertical size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Especialista"
        subtitle="Cadastro no corpo clínico"
      >
        <div className="modal-field">
          <label className="modal-label">Nome Completo *</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Ex: Dr. João Paulo Mendes"
            value={form.nome}
            onChange={e => setForm({...form, nome: e.target.value})}
          />
        </div>
        <div className="modal-grid-2">
          <div className="modal-field">
            <label className="modal-label">Especialidade *</label>
            <select
              className="modal-input"
              value={form.especialidade}
              onChange={e => setForm({...form, especialidade: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option>Clínico Geral</option>
              <option>Cardiologia</option>
              <option>Dermatologia</option>
              <option>Ginecologia</option>
              <option>Ortopedia</option>
              <option>Pediatria</option>
              <option>Psiquiatria</option>
              <option>Neurologia</option>
              <option>Oftalmologia</option>
            </select>
          </div>
          <div className="modal-field">
            <label className="modal-label">CRM / CRO</label>
            <input
              type="text"
              className="modal-input"
              placeholder="CRM-SP 12345"
              value={form.cro}
              onChange={e => setForm({...form, cro: e.target.value})}
            />
          </div>
        </div>
        <div className="modal-grid-2">
          <div className="modal-field">
            <label className="modal-label">Telefone</label>
            <input
              type="text"
              className="modal-input"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={e => setForm({...form, telefone: e.target.value})}
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">E-mail</label>
            <input
              type="email"
              className="modal-input"
              placeholder="dr@clinica.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
        </div>
        <button className="modal-btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'CADASTRAR ESPECIALISTA'}
        </button>
      </PremiumModal>
    </DashboardLayout>
  );
}
