'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Search, MoreHorizontal, MessageSquare, Activity, Zap, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PremiumModal from '@/components/PremiumModal/PremiumModal';
import styles from './patients.module.css';

export default function PatientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', origem: 'whatsapp' });

  const patients = [
    { id: 1, name: 'Marcos Vinícius de Souza', lastVisit: '15/03/2024', status: 'CONFIRMADO', risk: 'baixo', totalSpent: 'R$ 2.450' },
    { id: 2, name: 'Helena Costa Ribeiro', lastVisit: '10/03/2024', status: 'AUSENTE', risk: 'alto', totalSpent: 'R$ 1.890' },
    { id: 3, name: 'Sérgio Ramos Oliveira', lastVisit: '05/03/2024', status: 'FINALIZADO', risk: 'baixo', totalSpent: 'R$ 5.600' },
    { id: 4, name: 'Larissa Manoela Becker', lastVisit: '01/03/2024', status: 'PENDENTE', risk: 'médio', totalSpent: 'R$ 980' },
  ];

  const stats = [
    { label: 'TOTAL PACIENTES', value: '1.240', icon: <Users size={20} />, color: 'teal' },
    { label: 'NOVOS (MÊS)', value: '42', icon: <UserPlus size={20} />, color: 'green' },
    { label: 'RETORNANDO', value: '18', icon: <Activity size={20} />, color: 'blue' },
    { label: 'INATIVOS', value: '156', icon: <Zap size={20} />, color: 'purple' },
  ];

  const handleSave = async () => {
    if (!form.nome || !form.telefone) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ nome: '', telefone: '', email: '', origem: 'whatsapp' });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <h2>BASE DE PACIENTES</h2>
            <p>GESTÃO COMPLETA DE PRONTUÁRIOS E RELACIONAMENTO</p>
          </div>
          <button className={styles.newBtn} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /> NOVO PACIENTE
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
            <h3>LISTAGEM DE PACIENTES</h3>
            <div className={styles.searchBar}>
              <Search size={16} color="#535c68" />
              <input type="text" placeholder="Buscar por nome ou CPF..." />
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NOME DO PACIENTE</th>
                  <th>ÚLTIMA VISITA</th>
                  <th>SCORE IA</th>
                  <th>TOTAL INVESTIDO</th>
                  <th>STATUS</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.patientInfo}>
                        <strong>{p.name}</strong>
                        <span>ID: #100{p.id}99</span>
                      </div>
                    </td>
                    <td>{p.lastVisit}</td>
                    <td>
                      <span className={styles.riskBadge} data-risk={p.risk}>
                        RISCO {p.risk.toUpperCase()}
                      </span>
                    </td>
                    <td><strong>{p.totalSpent}</strong></td>
                    <td>{p.status}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn}><MessageSquare size={14} /></button>
                        <button className={styles.actionBtn}><MoreHorizontal size={14} /></button>
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
        title="Novo Paciente"
        subtitle="Cadastro na base da clínica"
      >
        <div className="modal-field">
          <label className="modal-label">Nome Completo *</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Ex: Maria Aparecida Silva"
            value={form.nome}
            onChange={e => setForm({...form, nome: e.target.value})}
          />
        </div>
        <div className="modal-grid-2">
          <div className="modal-field">
            <label className="modal-label">Telefone *</label>
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
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Origem do Lead</label>
          <select
            className="modal-input"
            value={form.origem}
            onChange={e => setForm({...form, origem: e.target.value})}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="site">Site</option>
            <option value="indicacao">Indicação</option>
            <option value="campanha">Campanha</option>
          </select>
        </div>
        <button className="modal-btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'CADASTRAR PACIENTE'}
        </button>
      </PremiumModal>
    </DashboardLayout>
  );
}
