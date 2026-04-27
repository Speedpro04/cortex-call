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
      <div className={styles.container} style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard Overview Carregado!</h1>
        <p>Se você consegue ver este texto, o problema estava nos cards ou na tabela do dashboard.</p>
        <pre style={{ marginTop: '20px', padding: '10px', background: '#eee' }}>
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>
    </DashboardLayout>
  );
}
