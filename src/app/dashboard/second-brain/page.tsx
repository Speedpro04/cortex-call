'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Plus, 
  Search, 
  Clock, 
  BrainCircuit,
  Database,
  Link as LinkIcon,
  Zap,
  Star,
  Sparkles,
  Trash2,
  Pin,
  Loader2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KnowledgeGraph from '@/components/KnowledgeBase/KnowledgeGraph';
import styles from './second-brain.module.css';
import toast from 'react-hot-toast';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import "easymde/dist/easymde.min.css";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
  created_at: string;
}

export default function SecondBrainPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Carregar notas do Supabase
  useEffect(() => {
    fetchNotes();
  }, [filterTag]);

  async function fetchNotes() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTag) params.set('tag', filterTag);
      
      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setNotes(data.notes || []);
        setAllTags(data.tags || []);
        if (!activeNoteId && data.notes?.length > 0) {
          setActiveNoteId(data.notes[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null,
  [activeNoteId, notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery, notes]);

  // Criar nova nota
  const handleAddNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nova Nota Estratégica',
          content: '# Nova Documentação\n\nEscreva aqui suas ideias...',
          tags: ['Rascunho'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.note, ...notes]);
        setActiveNoteId(data.note.id);
        toast.success('Nota criada!');
      }
    } catch (err) {
      toast.error('Erro ao criar nota');
    }
  };

  // Salvar nota (debounced)
  const saveNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    setSaving(true);
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, ...updates }),
      });
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Deletar nota
  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      const remaining = notes.filter(n => n.id !== noteId);
      setNotes(remaining);
      if (activeNoteId === noteId) {
        setActiveNoteId(remaining[0]?.id || null);
      }
      toast.success('Nota excluída');
    } catch (err) {
      toast.error('Erro ao excluir nota');
    }
  };

  // Pin/Unpin nota
  const handleTogglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const newPinned = !note.is_pinned;
    setNotes(notes.map(n => n.id === noteId ? { ...n, is_pinned: newPinned } : n));
    await saveNote(noteId, { is_pinned: newPinned } as any);
    toast.success(newPinned ? 'Nota fixada!' : 'Nota desafixada');
  };

  // Atualizar título localmente + salvar
  const handleTitleChange = (newTitle: string) => {
    if (!activeNoteId) return;
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, title: newTitle } : n));
    saveNote(activeNoteId, { title: newTitle } as any);
  };

  // Atualizar conteúdo localmente + salvar
  const handleContentChange = (newContent: string) => {
    if (!activeNoteId) return;
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, content: newContent } : n));
    saveNote(activeNoteId, { content: newContent } as any);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className={styles.container}>
      {/* 1. Sidebar Panel */}
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

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            <button 
              onClick={() => setFilterTag(null)}
              className={styles.tag}
              style={{ opacity: filterTag === null ? 1 : 0.5 }}
            >
              Todas
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={styles.tag}
                style={{ opacity: filterTag === tag ? 1 : 0.5 }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className={`${styles.notesList} ${styles.customScrollbar}`}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#64748b' }} />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              <BrainCircuit size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Nenhuma nota encontrada</p>
              <button onClick={handleAddNote} style={{ marginTop: '12px', color: '#3867d6', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                + Criar primeira nota
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => (
                <motion.div 
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`${styles.noteItem} ${activeNoteId === note.id ? styles.activeNoteItem : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 className={styles.noteTitle}>{note.title}</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {note.is_pinned && <Pin size={12} style={{ color: '#f59e0b' }} />}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                        style={{ opacity: 0.3, transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                      >
                        <Trash2 size={12} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.noteMeta}>
                    <div className="flex gap-1">
                      {note.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium ml-auto">{formatDate(note.updated_at)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.aside>

      {/* 2. Editor Panel */}
      <motion.main 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`${styles.panel} ${styles.mainPanel}`}
      >
        {activeNote ? (
          <>
            <div className={styles.editorHeader}>
              <input 
                className={styles.editorTitleInput}
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <div className={styles.editorToolbar}>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {saving ? (
                    <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> <span>Salvando...</span></>
                  ) : (
                    <><Save size={14} /> <span>Salvo no Supabase</span></>
                  )}
                </div>

                <button 
                  onClick={() => handleTogglePin(activeNote.id)}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ml-auto cursor-pointer"
                  style={{ color: activeNote.is_pinned ? '#f59e0b' : '#94a3b8' }}
                >
                  <Star size={14} style={activeNote.is_pinned ? { fill: '#f59e0b' } : {}} />
                  <span>{activeNote.is_pinned ? 'Fixada' : 'Fixar'}</span>
                </button>
              </div>
            </div>

            <div className={`${styles.editorContent} ${styles.customScrollbar}`}>
              <SimpleMDE 
                value={activeNote.content}
                onChange={handleContentChange}
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
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '16px' }}>
            <BrainCircuit size={48} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Selecione ou crie uma nota</p>
          </div>
        )}
      </motion.main>

      {/* 3. Graph Panel */}
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
            <span className="text-xs font-black uppercase tracking-[0.2em]">Mapa Neural</span>
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
              Cortex Thinking
            </h5>
            <p>
              {notes.length > 0 
                ? `Analisando ${notes.length} notas no seu vault. ${allTags.length} categorias identificadas.`
                : 'Crie sua primeira nota para ativar a análise de conexões.'
              }
            </p>
          </motion.div>

          <div className="mt-8">
            <h6 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Database size={12} />
              Stats do Vault
            </h6>
            <div className="space-y-3">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/70">Total de Notas</span>
                <span className="text-[14px] font-black text-white">{notes.length}</span>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/70">Tags</span>
                <span className="text-[14px] font-black text-white">{allTags.length}</span>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/70">Fixadas</span>
                <span className="text-[14px] font-black text-white">{notes.filter(n => n.is_pinned).length}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
