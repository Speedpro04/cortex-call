'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Sparkles, MessageSquare, Zap, TrendingUp, Users, ChevronRight, Play } from 'lucide-react';
import styles from './campaigns.module.css';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('suggested');

  const stats = [
    { label: 'CAMPANHAS ATIVAS', value: '2', color: 'orange' },
    { label: 'PACIENTES ALCANÇADOS', value: '47', color: 'blue' },
    { label: 'TAXA MÉDIA RETORNO', value: '28%', color: 'green' },
    { label: 'FATURAMENTO GERADO', value: 'R$ 12.480', color: 'purple' },
  ];

  const campaigns = [
    { 
      id: 1, 
      title: 'REVISÃO ODONTOLÓGICA', 
      canal: 'WhatsApp', 
      desc: 'O paciente não visita há mais de 6 meses sem retorno. Alta probabilidade de engajamento.',
      patients: '12 PACIENTES SELECIONADOS PELA IA',
      icon: <MessageSquare size={18} />
    },
    { 
      id: 2, 
      title: 'LIMPEZA PREVENTIVA', 
      canal: 'SMS', 
      desc: 'Pacientes com limpeza anual atrasada. Ideal para início de trimestre.',
      patients: '8 PACIENTES SELECIONADOS PELA IA',
      icon: <MessageSquare size={18} />
    },
    { 
      id: 3, 
      title: 'CLAREAMENTO / ESTÉTICA', 
      canal: 'WhatsApp', 
      desc: 'Pacientes que demonstraram interesse em procedimentos estéticos anteriormente.',
      patients: '6 PACIENTES SELECIONADOS PELA IA',
      icon: <Sparkles size={18} />
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleInfo}>
          <h2>CAMPANHAS INTELIGENTES</h2>
          <p>IA IDENTIFICA PACIENTES E DISPARA CAMPANHAS AUTOMATICAMENTE</p>
        </div>

        {/* Mini Stats Bar */}
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statInfo}>
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
              </div>
              <div className={styles.statIcon} data-color={stat.color}>
                <Zap size={16} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'suggested' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('suggested')}
            >
              <Sparkles size={14} /> SUGERIDAS PELA IA
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <Play size={14} /> ATIVAS <span className={styles.countBadge}>2</span>
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'results' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <TrendingUp size={14} /> RESULTADOS <span className={styles.countBadge}>5</span>
            </button>
          </div>
        </div>

        {/* Campaign List */}
        <div className={styles.campaignList}>
          <div className={styles.listHeader}>
            <Sparkles size={16} color="#ff7675" />
            <p>IA ANALISOU <span>450 PACIENTES</span> E SUGERE AS SEGUINTES CAMPANHAS</p>
          </div>

          <div className={styles.grid}>
            {campaigns.map((camp) => (
              <div key={camp.id} className={styles.campaignCard}>
                <div className={styles.cardIcon}>
                  {camp.icon}
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h4>{camp.title}</h4>
                    <span className={styles.canalBadge}>{camp.canal}</span>
                  </div>
                  <p className={styles.desc}>{camp.desc}</p>
                  <p className={styles.patientCount}>{camp.patients}</p>
                </div>

                <button className={styles.executeBtn}>
                  <Zap size={14} /> EXECUTAR COM IA
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
