'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Sparkles, Activity, Clock, Users, ArrowRight, Zap, TrendingUp, AlertCircle, MessageSquare, BrainCircuit, Headset } from 'lucide-react';
import styles from './overview.module.css';

export default function DashboardOverview() {
  const stats = [
    { label: 'TAXA DE ABANDONO', value: '18.4%', sub: '2.1% VS MÊS ANTERIOR', color: 'orange' },
    { label: 'CONVITES ENVIADOS', value: '142', sub: 'ESTE MÊS VIA WHATSAPP', color: 'blue' },
    { label: 'PACIENTES RECUPERADOS', value: '24', sub: 'RETORNARAM ESTE MÊS', color: 'green' },
    { label: 'FATURAMENTO RECUPERADO', value: 'R$ 12.480', sub: 'RECEITA REATIVADA', color: 'purple' },
    { label: 'TAXA DE RECUPERAÇÃO', value: '28%', sub: 'DOS PACIENTES EM CAMPANHA', color: 'coral' },
  ];

  const categories = [
    { id: 'agendados', label: 'AGENDADOS', count: 3 },
    { id: 'confirmados', label: 'CONFIRMADOS', count: 2 },
    { id: 'espera', label: 'EM ESPERA', count: 1 },
  ];

  const appointments = [
    { id: 1, name: 'Mariana Silva', proc: 'AVALIAÇÃO INICIAL', time: '09:00', risk: 'BAIXO', cat: 'agendados' },
    { id: 2, name: 'Roberto Alves', proc: 'CONSULTA', time: '10:00', risk: 'ALTO', cat: 'confirmados' },
    { id: 3, name: 'Fernando Souza', proc: 'RETORNO', time: '14:00', risk: 'MÉDIO', cat: 'espera' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* IA Alert Banner */}
        <div className={styles.alertBanner}>
          <div className={styles.alertIcon}>
            <Headset size={32} />
          </div>
          <div className={styles.alertText}>
            <strong>ALERTA DA IA — AÇÃO RECOMENDADA</strong>
            <p><span>15 pacientes</span> estão há mais de 6 meses sem retorno. Existe alto risco de abandono de tratamento. Recomendamos iniciar campanha de recuperação.</p>
          </div>
          <Link href="/dashboard/campaign" className={styles.alertBtn}>
            INICIAR CAMPANHA AUTOMÁTICA
          </Link>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIcon} data-color={stat.color}>
                <TrendingUp size={16} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3>{stat.value}</h3>
                <p className={styles.statSub}>{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kanbam Columns */}
        <div className={styles.columnsGrid}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <h3>{cat.label}</h3>
                <span className={styles.countBadge}>{cat.count}</span>
              </div>
              
              <div className={styles.columnContent}>
                {appointments
                  .filter(app => app.cat === cat.id)
                  .map(app => (
                    <div key={app.id} className={styles.appointmentCard}>
                      <div className={styles.cardTop}>
                        <div className={styles.riskBadge} data-risk={app.risk.toLowerCase()}>
                          {app.risk}
                        </div>
                        <div className={styles.timeInfo}>
                          <Clock size={12} />
                          <span>{app.time}</span>
                        </div>
                      </div>
                      
                      <div className={styles.cardBody}>
                        <h4>{app.name}</h4>
                        <p>{app.proc}</p>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.messageIcon}><MessageSquare size={14} /></div>
                        <button className={styles.statusBtn}>
                          {cat.id === 'agendados' ? 'CONFIRMAR' : 'AVANÇAR'} <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
