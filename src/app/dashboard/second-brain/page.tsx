'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Plus, 
  Search, 
  FileText, 
  Share2, 
  Clock, 
  BrainCircuit,
  Database,
  Link as LinkIcon,
  Zap,
  Star,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KnowledgeGraph from '@/components/KnowledgeBase/KnowledgeGraph';
import styles from './second-brain.module.css';


const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import "easymde/dist/easymde.min.css";

const INITIAL_NOTES = [
  { 
    id: '1', 
    title: 'Integração: Evolution API WhatsApp', 
    content: '# Configuração Evolution (Padrão Solara)\n\nConecte via [[Dashboard WhatsApp]]. Ative o webhook de [[Recuperação Ativa]] para monitorar janelas de retorno automáticas.\n\n## Diretrizes:\n1. Sincronizar com Solara AI.\n2. Configurar gatilhos de 3, 6 e 12 meses.', 
    updated: 'Just now', 
    tags: ['Infra', 'Evolution'] 
  },
  { 
    id: '2', 
    title: 'Estratégia: Protocolo de Manutenção Ótima', 
    content: '# Plano de Vendas\n\nFocar em pacientes de [[Implantes]] e [[Periodontia]] que não retornam há mais de 6 meses.', 
    updated: '1h ago', 
    tags: ['Estratégia', 'Vendas'] 
  },
  { 
    id: '3', 
    title: 'IA: Insights de Conversão Solara', 
    content: '# Insights de Performance\n\nO motor **Solara AI** detectou que leads vindos de campanhas de "Aparelhos Invisíveis" possuem o maior ticket médio.\n\n**Ação sugerida:** Aprimorar o script de fechamento para estes leads.', 
    updated: 'Ontem', 
    tags: ['IA', 'Gestão'] 
  },
];


export default function SecondBrainPage() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || notes[0],
  [activeNoteId, notes]);

  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Nova Nota Estratégica',
      content: '# Nova Documentação\n\nEscreva aqui suas ideias...',
      updated: 'Just now',
      tags: ['Rascunho']
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  return (
    <div className={styles.container}>
      {/* 1. Sidebar Panel (Glassmorphism) */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${styles.panel} ${styles.sidebarPanel}`}
      >
        <div className={styles.header}>
          <div className={styles.titlesContainer}>
            <p>Conhecimento</p>
            <h2>Neural Brain</h2>
          </div>
          <button onClick={handleAddNote} className={styles.addButton}>
            <Plus size={20} />
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar conexões..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={`${styles.notesList} ${styles.customScrollbar}`}>
          <AnimatePresence mode="popLayout">
            {notes.map((note, index) => (
              <motion.div 
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveNoteId(note.id)}
                className={`${styles.noteItem} ${activeNoteId === note.id ? styles.activeNoteItem : ''}`}
              >
                <h4 className={styles.noteTitle}>{note.title}</h4>
                <div className={styles.noteMeta}>
                  <div className="flex gap-1">
                    {note.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium ml-auto">{note.updated}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* 2. Editor Panel (Main Area) */}
      <motion.main 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`${styles.panel} ${styles.mainPanel}`}
      >
        <div className={styles.editorHeader}>
          <input 
            className={styles.editorTitleInput}
            value={activeNote.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setNotes(notes.map(n => n.id === activeNoteId ? {...n, title: newTitle} : n));
            }}
          />
          <div className={styles.editorToolbar}>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <Clock size={14} />
              <span>Sincronizado via Solara Sync</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-yellow-500 uppercase tracking-widest ml-auto">
              <Star size={14} className="fill-yellow-500" />
              <span>Nota Prioritária</span>
            </div>
          </div>
        </div>

        <div className={`${styles.editorContent} ${styles.customScrollbar}`}>
          <SimpleMDE 
            value={activeNote.content}
            onChange={(val) => {
              setNotes(notes.map(n => n.id === activeNoteId ? {...n, content: val} : n));
            }}
            options={{
              spellChecker: false,
              status: false,
              autofocus: true,
              renderingConfig: {
                singleLineBreaks: false,
                codeSyntaxHighlighting: true,
              },
            }}
          />
        </div>

        <div className="absolute bottom-8 right-8 flex gap-4">
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="bg-[#006266] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#006266]/30 flex items-center gap-3"
           >
             <Zap size={16} /> Salvar no RAG
           </motion.button>
        </div>
      </motion.main>

      {/* 3. Graph Panel (Dark) */}
      <motion.aside 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`${styles.panel} ${styles.graphPanel} ${styles.panelDark}`}
      >
        <div className={styles.graphHeader}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006266]/20 flex items-center justify-center text-[#006266]">
              <LinkIcon size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Mapa Neural de Gaia</span>

          </div>
        </div>

        <div className={styles.graphContainer}>
          <KnowledgeGraph />
        </div>

        <div className={styles.aiSidebar}>
          <motion.div 
            whileHover={{ y: -5 }}
            className={styles.aiCard}
          >
            <h5>
              <Sparkles size={14} />
              Solara Thinking
            </h5>
            <p>
              Identifiquei padrões entre este protocolo e a sua última campanha de bioestimuladores. Deseja unificar os dados para otimizar o atendimento?
            </p>
            <button className="mt-4 w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Otimizar Conhecimento
            </button>
          </motion.div>

          <div className="mt-8">
            <h6 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Database size={12} />
              Conexões Ativas
            </h6>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="w-2 h-2 rounded-full bg-[#006266]"></div>

                  <span className="text-[11px] font-bold text-white/70">Protocolo Facial V2</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
