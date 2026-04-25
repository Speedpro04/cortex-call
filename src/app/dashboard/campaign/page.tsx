'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Zap, MessageSquare, Users, TrendingUp, Clock, CheckCircle2, Play, Pause, Settings, Plus, Send, Target, Calendar } from 'lucide-react';
import styles from './campaign.module.css';

interface Step {
  day: string;
  action: string;
  done: boolean;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  canal: string;
  patients: number;
  sent: number;
  returned: number;
  rate: string;
  start: string;
  message: string;
  steps: Step[];
}

export default function AutoCampaignPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success && data.campaigns) {
        setActiveCampaigns(data.campaigns);
        if (data.campaigns.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const templates = [
    { id: 'tpl-1', name: 'Volta após abandono', icon: <Target size={18} />, patients: 15, desc: 'Para quem não retornou há mais de 6 meses', msg: 'Olá, {nome}! Notamos que faz um tempo desde sua última visita. O motor da Solara identificou que seria importante uma revisão. Que tal agendar?' },
    { id: 'tpl-2', name: 'Revisão periódica', icon: <Calendar size={18} />, patients: 23, desc: 'Para quem está com revisão em atraso', msg: 'Oi {nome}, sua saúde bucal é nossa prioridade. Sua revisão periódica está pendente. Temos um horário especial na próxima semana. Vamos confirmar?' },
    { id: 'tpl-3', name: 'Oferta Clareamento', icon: <Zap size={18} />, patients: 11, desc: 'Para interessados em procedimentos estéticos', msg: 'Oi {nome}! Temos uma oferta imperdível de clareamento este mês especialmente para os pacientes fiéis da clínica.' },
  ];

  const handleStartTemplate = async (tpl: any) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tpl.name,
          tipo: 'recovery',
          message: tpl.msg,
          patients_count: tpl.patients,
          steps: [
            { day: 'Dia 1', action: 'WhatsApp inicial enviado pela IA', done: false },
            { day: 'Dia 3', action: 'Lembrete automático se não responder', done: false }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCampaigns();
        setSelectedCampaignId(data.campaign.id);
        setActiveTab('active');
        alert('Campanha iniciada com sucesso! A Solara IA assumiu os disparos.');
      } else {
        alert('Erro ao iniciar campanha.');
      }
    } catch (err) {
      alert('Erro de comunicação com a API.');
    }
  };

  const current = activeCampaigns.find(c => c.id === selectedCampaignId) || activeCampaigns[0];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <h2>CAMPANHAS AUTOMÁTICAS</h2>
            <p>SOLARA IA GERENCIA CAMPANHAS E DISPARA MENSAGENS ESTRATÉGICAS VIA WHATSAPP</p>
          </div>
          <button className={styles.newBtn} onClick={() => setActiveTab('templates')}>
            <Plus size={18} /> NOVA CAMPANHA
          </button>
        </div>

        {/* KPI Row */}
        <div className={styles.kpiRow}>
          {[
            { label: 'CAMPANHAS ATIVAS', value: activeCampaigns.length.toString(), icon: <Zap size={16} />, color: 'teal' },
            { label: 'MENSAGENS ENVIADAS', value: activeCampaigns.reduce((sum, c) => sum + c.sent, 0).toString(), icon: <Send size={16} />, color: 'blue' },
            { label: 'PACIENTES ATINGIDOS', value: activeCampaigns.reduce((sum, c) => sum + c.patients, 0).toString(), icon: <Users size={16} />, color: 'green' },
            { label: 'RETORNO TOTAL', value: activeCampaigns.reduce((sum, c) => sum + c.returned, 0).toString(), icon: <TrendingUp size={16} />, color: 'coral' },
          ].map((kpi, i) => (
            <div key={i} className={styles.kpiCard}>
              <div className={styles.kpiIcon} data-color={kpi.color}>{kpi.icon}</div>
              <div>
                <p>{kpi.label}</p>
                <h3>{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['active', 'templates', 'history'].map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'active' ? 'CAMPANHAS ATIVAS' : tab === 'templates' ? 'MODELOS DE IA' : 'HISTÓRICO'}
            </button>
          ))}
        </div>

        {activeTab === 'active' && (
          <div className={styles.mainGrid}>
            {/* Left: Campaign List */}
            <div className={styles.campaignList}>
              {loading ? (
                <div style={{ padding: '20px', color: '#535c68' }}>Carregando campanhas do Supabase...</div>
              ) : activeCampaigns.length === 0 ? (
                <div style={{ padding: '20px', color: '#535c68' }}>Nenhuma campanha ativa. Vá para "Modelos de IA" para iniciar a primeira!</div>
              ) : (
                activeCampaigns.map(camp => (
                  <div
                    key={camp.id}
                    className={`${styles.campaignItem} ${selectedCampaignId === camp.id ? styles.selected : ''}`}
                    onClick={() => setSelectedCampaignId(camp.id)}
                  >
                    <div className={styles.campaignItemTop}>
                      <h4>{camp.name}</h4>
                      <span className={styles.statusPill} data-status="active">{camp.status}</span>
                    </div>
                    <div className={styles.campaignItemMeta}>
                      <MessageSquare size={12} /> {camp.canal}
                      <span> · </span>
                      <Users size={12} /> {camp.patients} pacientes
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: camp.rate }}
                      ></div>
                    </div>
                    <div className={styles.progressLabel}>
                      <span>{camp.returned} retornos</span>
                      <span>{camp.rate} conversão</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Campaign Detail */}
            {current && activeCampaigns.length > 0 && (
              <div className={styles.campaignDetail}>
                <div className={styles.detailHeader}>
                  <div>
                    <h3>{current.name}</h3>
                    <p>Iniciada em {current.start} · {current.canal}</p>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.pauseBtn}><Pause size={16} /> PAUSAR</button>
                    <button className={styles.settingsBtn}><Settings size={16} /></button>
                  </div>
                </div>

                {/* Stats */}
                <div className={styles.detailStats}>
                  {[
                    { label: 'TOTAL PACIENTES', value: current.patients },
                    { label: 'ENVIADOS', value: current.sent },
                    { label: 'RETORNARAM', value: current.returned },
                    { label: 'TAXA', value: current.rate },
                  ].map((s, i) => (
                    <div key={i} className={styles.detailStat}>
                      <p>{s.label}</p>
                      <h4>{s.value}</h4>
                    </div>
                  ))}
                </div>

                {/* Message Preview */}
                <div className={styles.messagePreview}>
                  <label>MENSAGEM AUTOMÁTICA OTIMIZADA PELA IA</label>
                  <div className={styles.messageBubble}>
                    <div className={styles.msgAvatar}></div>
                    <p>{current.message}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className={styles.timeline}>
                  <label>SEQUÊNCIA DE AÇÕES EXECUTADAS PELA IA</label>
                  {current.steps.map((step, i) => (
                    <div key={i} className={`${styles.timelineStep} ${step.done ? styles.done : ''}`}>
                      <div className={styles.stepIcon}>
                        {step.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div className={styles.stepInfo}>
                        <strong>{step.day}</strong>
                        <p>{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className={styles.templatesGrid}>
            <div className={styles.iaNote}>
              <Zap size={16} color="#ff7675" />
              <p>O MOTOR POLARS E A SOLARA IA ANALISARAM SUA BASE DE PACIENTES E RECOMENDAM ESSAS CAMPANHAS</p>
            </div>
            {templates.map(tpl => (
              <div key={tpl.id} className={styles.templateCard}>
                <div className={styles.tplIcon}>{tpl.icon}</div>
                <div className={styles.tplInfo}>
                  <h4>{tpl.name}</h4>
                  <p>{tpl.desc}</p>
                  <span>{tpl.patients} pacientes elegíveis</span>
                </div>
                <button className={styles.tplBtn} onClick={() => handleStartTemplate(tpl)}>
                  <Play size={14} /> INICIAR IA
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.historyWrapper}>
            <p className={styles.emptyMsg}>Nenhuma campanha finalizada ainda. A IA continua trabalhando em suas campanhas ativas.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
