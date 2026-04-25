'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { DollarSign, Clock, CheckCircle2, ChevronDown, Eye, Plus, ArrowUpRight, TrendingUp } from 'lucide-react';
import styles from './finance.module.css';

export default function FinancePage() {
  const invoices = [
    { id: 'NF-2847', patient: 'Beatriz Almeida', value: 'R$ 180,00', date: '08/04/2026', status: 'PAGO' },
    { id: 'NF-2848', patient: 'Ricardo Fernandes', value: 'R$ 850,00', date: '08/04/2026', status: 'PENDENTE' },
    { id: 'NF-2849', patient: 'Camila Souza', value: 'R$ 320,00', date: '07/04/2026', status: 'ATRASADO' },
    { id: 'NF-2850', patient: 'Fernando Lima', value: 'R$ 450,00', date: '13/04/2026', status: 'PENDENTE' },
  ];

  const payments = [
    { amount: 'R$ 249,00', date: '01/04/2026', status: 'APROVADO' },
    { amount: 'R$ 249,00', date: '01/03/2026', status: 'APROVADO' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div className={styles.titleInfo}>
            <h2>FINANCEIRO</h2>
            <p>GERENCIE RECEITAS, FATURAS E PLANOS</p>
          </div>
          <button className={styles.hideBtn}>
            <Eye size={18} /> OCULTAR VALORES
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p>RECEITA DO MÊS</p>
              <h3>R$ 28.450,00</h3>
              <div className={styles.trend}><TrendingUp size={12} /> +12.3%</div>
            </div>
            <div className={`${styles.icon} ${styles.teal}`}><DollarSign size={24} /></div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p>FATURAS PENDENTES</p>
              <h3>R$ 4.280,00</h3>
              <div className={styles.sub}>8 FATURAS</div>
            </div>
            <div className={`${styles.icon} ${styles.blue}`}><Clock size={24} /></div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p>FATURAS PAGAS</p>
              <h3>R$ 24.170,00</h3>
              <div className={styles.sub}>47 FATURAS</div>
            </div>
            <div className={`${styles.icon} ${styles.green}`}><CheckCircle2 size={24} /></div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          {/* Main Column: Invoices */}
          <div className={styles.invoicesCol}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>FATURAS RECENTES</h3>
              <div className={styles.filterSelect}>
                Todos os status <ChevronDown size={14} />
              </div>
            </div>
            
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NÚMERO</th>
                    <th>PACIENTE</th>
                    <th>VALOR</th>
                    <th>VENCIMENTO</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className={styles.id}>{inv.id}</td>
                      <td className={styles.patient}>{inv.patient}</td>
                      <td className={styles.val}>{inv.value}</td>
                      <td className={styles.date}>{inv.date}</td>
                      <td>
                        <div className={styles.statusBadge} data-status={inv.status.toLowerCase()}>
                          {inv.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Column: Plans & History */}
          <div className={styles.sideCol}>
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <h3>PLANO REAL</h3>
              </div>
              <div className={styles.planBody}>
                <div className={styles.planLabel}>PLANO PRO</div>
                <div className={styles.planPrice}>R$ 249</div>
                
                <div className={styles.planStats}>
                  <div className={styles.planStatItem}>
                    <p>DENTISTAS</p>
                    <strong>2 de 4</strong>
                  </div>
                  <div className={styles.planStatItem}>
                    <p>PRÓXIMA COBRANÇA</p>
                    <strong>01/05/2026</strong>
                  </div>
                </div>

                <button className={styles.upgradeBtn}>
                  <ArrowUpRight size={16} /> FAZER UPGRADE
                </button>
              </div>
            </div>

            <div className={styles.historyCard}>
              <h3>HISTÓRICO DE PAGAMENTOS</h3>
              <div className={styles.historyList}>
                {payments.map((p, i) => (
                  <div key={i} className={styles.historyItem}>
                    <div className={styles.historyInfo}>
                      <strong>{p.amount}</strong>
                      <p>{p.date}</p>
                    </div>
                    <div className={styles.historyStatus}>{p.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
