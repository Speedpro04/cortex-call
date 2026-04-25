'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { MessageSquare, User, TrendingUp, TrendingDown, Clock, Search, Send, Calendar, CheckCircle2 } from 'lucide-react';
import styles from './recovery.module.css';

interface Patient {
  id: string;
  name: string;
  phone: string;
  attempts?: string;
  lastVisit: string;
  reason: string;
  score: string;
  lastContact: string;
  canal: string;
  suggestion: string;
  statusMsg?: string;
}

export default function RecoveryPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/recovery');
        const data = await res.json();
        if (data.success) {
          setPatients(data.patients.map((p: any) => ({ ...p, attempts: '1 TENTATIVA' })));
          
          // Map icons and colors
          const iconMap: any = {
            'orange': <TrendingDown size={14} />,
            'blue': <MessageSquare size={14} />,
            'green': <TrendingUp size={14} />,
            'purple': <Clock size={14} />
          };
          
          const mappedStats = data.stats.map((s: any) => ({
            ...s,
            icon: iconMap[s.color]
          }));
          setStats(mappedStats);
        }
      } catch (err) {
        console.error('Failed to load recovery data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSendMsg = async (patientId: string, phone: string) => {
    // Update local state to show sending
    setPatients(patients.map(p => p.id === patientId ? { ...p, statusMsg: 'sending' } : p));
    
    try {
      const res = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_recovery_message', patient_id: patientId, phone })
      });
      const data = await res.json();
      
      if (data.success) {
        setPatients(patients.map(p => p.id === patientId ? { ...p, statusMsg: 'sent', attempts: '2 TENTATIVAS' } : p));
      } else {
        setPatients(patients.map(p => p.id === patientId ? { ...p, statusMsg: 'error' } : p));
        alert('Erro ao enviar mensagem: ' + data.error);
      }
    } catch (err) {
      setPatients(patients.map(p => p.id === patientId ? { ...p, statusMsg: 'error' } : p));
      alert('Erro na comunicação com a API.');
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleInfo}>
          <h2>RECUPERAÇÃO DE PACIENTES</h2>
          <p>REATIVE PACIENTES AUSENTES COM AUXÍLIO DA IA</p>
        </div>

        {/* Mini Stats Bar */}
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
            <div className={styles.headerTitle}>
              <h3>PACIENTES PRIORITÁRIOS PARA RECUPERAÇÃO</h3>
              <p>SOLARA IDENTIFICA URGÊNCIA AUTOMATICAMENTE</p>
            </div>
            <button className={styles.viewAllBtn}>VER TODOS OS PACIENTES</button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PACIENTE</th>
                  <th>ÚLTIMA VISITA</th>
                  <th>MOTIVO</th>
                  <th>SCORE IA</th>
                  <th>ÚLTIMO CONTATO</th>
                  <th>CANAL</th>
                  <th>SUGESTÃO IA</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Analisando pacientes com motor Polars...</td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Nenhum paciente prioritário no momento.</td></tr>
                ) : patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.patientCell}>
                        <strong>{p.name}</strong>
                        <span>{p.attempts}</span>
                      </div>
                    </td>
                    <td className={styles.mutedText}>{p.lastVisit}</td>
                    <td className={styles.italicText}>{p.reason}</td>
                    <td>
                      <div className={styles.scoreBadge} data-score={p.score.toLowerCase()}>
                        {p.score}
                      </div>
                    </td>
                    <td className={styles.mutedText}>{p.lastContact}</td>
                    <td>
                      <div className={styles.canalIcon}>
                        {p.canal.includes('WhatsApp') ? <MessageSquare size={14} /> : <Send size={14} />}
                        <span>{p.canal}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.suggestionCell}>
                        <AlertCircleIcon />
                        <span>{p.suggestion}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {p.statusMsg === 'sending' ? (
                          <span style={{ fontSize: '12px', color: '#ff9f43' }}>Enviando...</span>
                        ) : p.statusMsg === 'sent' ? (
                          <span style={{ fontSize: '12px', color: '#10ac84', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> Enviado</span>
                        ) : (
                          <button onClick={() => handleSendMsg(p.id, p.phone)} className={styles.sendBtn} title="Enviar IA pela Solara">
                            <Send size={14} />
                          </button>
                        )}
                        <button className={styles.profileBtn}><User size={14} /></button>
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

function AlertCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#ff7675'}}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
