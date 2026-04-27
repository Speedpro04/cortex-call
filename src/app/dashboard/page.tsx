'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Clock, ArrowRight, TrendingUp, MessageSquare, Headset, Loader2 } from 'lucide-react';
import styles from './overview.module.css';

interface DashboardStats {
  abandonRate: string;
  totalSent: string;
  totalRecovered: string;
  estimatedRevenue: string;
  recoveryRate: string;
  avgNps: string | null;
}

interface Appointment {
  id: string;
  name: string;
  proc: string;
  time: string;
  risk: string;
  status: string;
  doctor: string;
  specialty: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setAppointments(data.appointments || []);
          setAlertCount(data.alertPatients || 0);
        } else {
          console.error('API Error:', data.error);
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const statCards = stats ? [
    { label: 'TAXA DE ABANDONO', value: stats.abandonRate, sub: 'PACIENTES EM RISCO', color: 'orange' },
    { label: 'CONVITES ENVIADOS', value: stats.totalSent, sub: 'ESTE MÊS VIA WHATSAPP', color: 'blue' },
    { label: 'PACIENTES RECUPERADOS', value: stats.totalRecovered, sub: 'RETORNARAM ESTE MÊS', color: 'green' },
    { label: 'FATURAMENTO RECUPERADO', value: stats.estimatedRevenue, sub: 'RECEITA REATIVADA', color: 'purple' },
    { label: 'TAXA DE RECUPERAÇÃO', value: stats.recoveryRate, sub: 'DOS PACIENTES EM CAMPANHA', color: 'coral' },
  ] : [];

  const categories = [
    { id: 'pending', label: 'AGENDADOS', appointments: appointments.filter(a => a.status === 'pending' || a.status === 'scheduled') },
    { id: 'confirmed', label: 'CONFIRMADOS', appointments: appointments.filter(a => a.status === 'confirmed') },
    { id: 'completed', label: 'CONCLUÍDOS', appointments: appointments.filter(a => a.status === 'completed') },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', fontWeight: 600, letterSpacing: '1px', fontSize: '12px', textTransform: 'uppercase' }}>Carregando inteligência...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* IA Alert Banner */}
        {alertCount > 0 && (
          <div className={styles.alertBanner}>
            <div className={styles.alertIcon}>
              <Headset size={32} />
            </div>
            <div className={styles.alertText}>
              <strong>ALERTA DA IA — AÇÃO RECOMENDADA</strong>
              <p><span>{alertCount} pacientes</span> estão há mais de 6 meses sem retorno. Existe alto risco de abandono de tratamento. Recomendamos iniciar campanha de recuperação.</p>
            </div>
            <Link href="/dashboard/campaign" className={styles.alertBtn}>
              INICIAR CAMPANHA AUTOMÁTICA
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {statCards.map((stat, i) => (
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

        {/* Kanban Columns */}
        <div className={styles.columnsGrid}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <h3>{cat.label}</h3>
                <span className={styles.countBadge}>{cat.appointments.length}</span>
              </div>
              
              <div className={styles.columnContent}>
                {cat.appointments.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                    Nenhum agendamento
                  </div>
                ) : (
                  cat.appointments.map(app => (
                    <div key={app.id} className={styles.appointmentCard}>
                      <div className={styles.cardTop}>
                        <div className={styles.riskBadge} data-risk={(app.risk || 'MÉDIO').toLowerCase()}>
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
                        {app.doctor && <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Dr(a). {app.doctor}</p>}
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.messageIcon}><MessageSquare size={14} /></div>
                        <button className={styles.statusBtn}>
                          {cat.id === 'pending' ? 'CONFIRMAR' : 'AVANÇAR'} <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
