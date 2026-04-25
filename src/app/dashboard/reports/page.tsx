'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { TrendingUp, Users, Activity, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Clock, Star, Download } from 'lucide-react';
import styles from './reports.module.css';

export default function ReportsPage() {
  const kpis = [
    { label: 'RECUPERAÇÃO GLOBAL', value: '31.2%', trend: '+4.5%', color: 'green' },
    { label: 'NOVOS AGENDAMENTOS', value: '1,240', trend: '+12%', color: 'blue' },
    { label: 'CHURN DE PACIENTES', value: '4.8%', trend: '-1.2%', color: 'red' },
    { label: 'NPS MÉDIO', value: '9.4', trend: '+0.2', color: 'orange' },
  ];

  const monthlyData = [
    { month: 'JAN', val: 65 },
    { month: 'FEV', val: 78 },
    { month: 'MAR', val: 92 },
    { month: 'ABR', val: 88 },
    { month: 'MAI', val: 95 },
    { month: 'JUN', val: 110 },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleSection}>
            <h2>RELATÓRIOS E MÉTRICAS</h2>
            <p>ANÁLISE PROFUNDA DE PERFORMANCE E RECUPERAÇÃO DE PACIENTES</p>
          </div>
          <div className={styles.dateFilter}>
            <Calendar size={16} />
            <span>ÚLTIMOS 6 MESES</span>
            <Download size={16} />
          </div>
        </div>

        {/* KPI Grid */}
        <div className={styles.kpiGrid}>
          {kpis.map((kpi, i) => (
            <div key={i} className={styles.kpiCard} data-color={kpi.color}>
              <p className={styles.kpiLabel}>{kpi.label}</p>
              <h3 className={styles.kpiValue}>{kpi.value}</h3>
              <div className={styles.kpiTrend}>
                {kpi.trend.startsWith('+') ? <ArrowUpRight size={14} className={styles.trendUp} /> : <ArrowDownRight size={14} className={styles.trendDown} />}
                <span className={kpi.trend.startsWith('+') ? styles.trendUp : styles.trendDown}>{kpi.trend} VS PERÍODO ANTERIOR</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts */}
        <div className={styles.chartsGrid}>
          {/* Patients Attended Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>PACIENTES ATENDIDOS MENSALMENTE</h3>
              <Activity size={18} color="#006266" />
            </div>
            <div className={styles.barChart}>
              {monthlyData.map((d, i) => (
                <div key={i} className={styles.barWrapper}>
                  <div 
                    className={styles.bar} 
                    style={{ height: `${d.val}%` }}
                    data-value={d.val}
                  ></div>
                  <span className={styles.barLabel}>{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency Tiles */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>EFICIÊNCIA OPERACIONAL</h3>
              <Clock size={18} color="#006266" />
            </div>
            <div className={styles.efficiencyGrid}>
              <div className={styles.effTile}>
                <h5>TEMPO MÉDIO CONSULTA</h5>
                <strong>42 MIN</strong>
              </div>
              <div className={styles.effTile}>
                <h5>TAXA DE CONVERSÃO</h5>
                <strong>68%</strong>
              </div>
              <div className={styles.effTile}>
                <h5>RETENÇÃO</h5>
                <strong>92%</strong>
              </div>
              <div className={styles.effTile}>
                <h5>NPS GERAL</h5>
                <strong>9.4</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Churn and Recovery Ranking */}
        <div className={styles.chartsGrid}>
           <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>PERDA DE PACIENTES (CHURN) POR MOTIVO</h3>
              <ArrowDownRight size={18} color="#ff4757" />
            </div>
            <div className={styles.rankingList}>
              {[
                { label: 'MUDANÇA DE ENDEREÇO', val: '42%', desc: '14 pacientes' },
                { label: 'PREÇO / CONDIÇÃO', val: '28%', desc: '9 pacientes' },
                { label: 'EXPERIÊNCIA NEGATIVA', val: '15%', desc: '5 pacientes' },
                { label: 'OUTROS', val: '15%', desc: '5 pacientes' },
              ].map((item, i) => (
                <div key={i} className={styles.rankingItem}>
                  <div className={styles.rankingInfo}>
                    <h4>{item.label}</h4>
                    <p>{item.desc}</p>
                  </div>
                  <span className={styles.rankingValue}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>FATURAMENTO RECUPERADO</h3>
              <DollarSign size={18} color="#006266" />
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#006266' }}>R$ 142.580</h2>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#535c68', marginTop: '10px' }}>TOTAL RECUPERADO PELA SOLARA IA</p>
              <div style={{ marginTop: '30px', padding: '20px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#2ed573' }}>ROI ESTIMADO: 14x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
