import { MessageSquare, PlusCircle, Search, MoreHorizontal, Send, Phone, Video, Activity, Zap, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './conversations.module.css';

export default function ConversationsPage() {
  const chats = [
    { id: 1, name: 'Marcos Vinícius', lastMsg: 'Temos um horário disponível amanhã?', time: '14:20', active: true },
    { id: 2, name: 'Helena Costa', lastMsg: 'Obrigada pelo atendimento!', time: '11:05', active: false },
    { id: 3, name: 'Sérgio Ramos', lastMsg: 'Pode confirmar minha limpeza?', time: 'Ontem', active: false },
    { id: 4, name: 'Clínica Sorriso', lastMsg: 'Campanha de retorno enviada.', time: 'Ontem', active: false },
  ];

  const stats = [
    { label: 'MENSAGENS HOJE', value: '342', icon: <MessageSquare size={20} />, color: 'blue' },
    { label: 'ATIVOS AGORA', value: '18', icon: <Activity size={20} />, color: 'green' },
    { label: 'PENDENTES', value: '4', icon: <Zap size={20} />, color: 'purple' },
    { label: 'TX. RESPOSTA', value: '98%', icon: <Sparkles size={20} />, color: 'teal' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <h2>CONVERSAS (WHATSAPP)</h2>
            <p>CENTRAL DE RELACIONAMENTO COM PACIENTES</p>
          </div>
          <button className={styles.newBtn}>
            <PlusCircle size={18} /> NOVA CONVERSA
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

        {/* Chat Interface */}
        <div className={styles.chatLayout}>
          {/* Sidebar */}
          <div className={styles.chatSidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.searchBar}>
                <Search size={16} color="#535c68" />
                <input type="text" placeholder="Buscar conversas..." />
              </div>
            </div>
            <div className={styles.chatList}>
              {chats.map((c) => (
                <div key={c.id} className={`${styles.chatItem} ${c.active ? styles.activeChat : ''}`}>
                  <div className={styles.avatar}>{c.name[0]}</div>
                  <div className={styles.chatMeta}>
                    <h4>{c.name}</h4>
                    <p>{c.lastMsg}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#535c68' }}>{c.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={styles.chatMain}>
            <div className={styles.chatHeader}>
              <div className={styles.userInfo}>
                <h4>Marcos Vinícius</h4>
                <span>Online</span>
              </div>
              <div style={{ display: 'flex', gap: '15px', color: '#535c68' }}>
                <Phone size={18} />
                <Video size={18} />
                <MoreHorizontal size={18} />
              </div>
            </div>

            <div className={styles.messages}>
              <div className={`${styles.message} ${styles.received}`}>
                Olá! Temos um horário disponível amanhã para minha revisão?
              </div>
              <div className={`${styles.message} ${styles.sent}`}>
                Olá Marcos! Sim, temos um horário disponível às 10h. Pode ser?
              </div>
            </div>

            <div className={styles.chatInput}>
              <input type="text" placeholder="Escreva sua mensagem..." />
              <button className={styles.sendBtn}><Send size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
