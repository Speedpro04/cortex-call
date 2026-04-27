'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, X, Send, Sparkles, Headset } from 'lucide-react';
import styles from './chat.module.css';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SolaraChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SolaraChat({ isOpen, onClose }: SolaraChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Conectado ao canal de suporte da clínica. Como podemos ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive uma instabilidade neural temporária. Como posso retomar?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#273c75] text-white">
            <Headset size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[2px] opacity-60 uppercase">Comunicação Interna</span>
            <span className="text-xs font-bold uppercase tracking-widest">Solara Cortex</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             className={styles.closeButton} 
             onClick={() => setMessages([{ role: 'model', text: 'Histórico limpo. Pronto para novos insights.' }])}
             title="Limpar memória"
           >
             <Trash2 size={16} />
           </button>
           <button 
             className={styles.closeButton} 
             onClick={onClose}
             title="Fechar chat"
           >
             <X size={18} />
           </button>
        </div>
      </div>
      
      <div className={styles.messages} ref={scrollRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
          >
            {msg.role === 'model' && (
              <div className="flex items-center gap-2 mb-2 opacity-40">
                <Headset size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">Suporte Clínica</span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
             <div className="flex gap-1 items-center p-1">
                <div className="w-1.5 h-1.5 bg-[#706fd3] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#706fd3] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-[#706fd3] rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <input 
          className={styles.input}
          type="text" 
          placeholder="Consulte sua estratégia..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          autoFocus
        />
        <button className={styles.sendButton} onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? <Sparkles className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
