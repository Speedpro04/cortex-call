'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Stethoscope, Plus, MoreVertical, Edit2, Activity, Users, Sparkles } from 'lucide-react';
import styles from './specialists.module.css';

export default function SpecialistsPage() {
  const specialists = [
    { id: 1, name: 'Dr. Roberto Cardoso', specialty: 'Implantodontia', status: 'ATIVO', patients: 142, rating: 4.9 },
    { id: 2, name: 'Dra. Mara Silveira', specialty: 'Ortodontia', status: 'ATIVO', patients: 98, rating: 4.8 },
    { id: 3, name: 'Dr. Henrique Neto', specialty: 'Clínico Geral', status: 'ATIVO', patients: 210, rating: 5.0 },
    { id: 4, name: 'Dra. Alice Ferreira', specialty: 'Odontopediatria', status: 'ATIVO', patients: 65, rating: 4.7 },
  ];

  const stats = [
    { label: 'TOTAL DOUTORES', value: '12', icon: <Stethoscope size={20} />, color: 'teal' },
    { label: 'ATIVOS HOJE', value: '8', icon: <Activity size={20} />, color: 'green' },
    { label: 'ESPECIALIDADES', value: '6', icon: <Users size={20} />, color: 'blue' },
    { label: 'AVALIAÇÃO MÉDIA', value: '4.9', icon: <Sparkles size={20} />, color: 'purple' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <h2>ESPECIALISTAS</h2>
            <p>GESTÃO DE CORPO CLÍNICO E PERFORMANCE</p>
          </div>
          <button className={styles.newBtn}>
            <Plus size={18} /> NOVO ESPECIALISTA
          </button>
        </div>

        {/* KPI Grid */}
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

        {/* Specialists Table */}
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
                        <span>CONSELHO: CRO-SP {12345 + s.id}</span>
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
    </DashboardLayout>
  );
}
