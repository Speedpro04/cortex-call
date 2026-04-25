'use client';

import React from 'react';
import { Sparkles, Bell, Search, Settings } from 'lucide-react';
import Logo, { PowerSun } from '../Logo/Logo';
import styles from './header.module.css';

interface HeaderProps {
  onOpenChat?: () => void;
}

export default function Header({ onOpenChat }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleSection}>
          <h1>Cortex Call</h1>
          <p>GESTÃO INTELIGENTE PARA CLÍNICAS ODONTOLÓGICAS</p>
        </div>
      </div>

      <div className={styles.middle}>
        <div className={styles.badge}>
          <div className={styles.dot}></div>
          <span>SOLARA ATENDENDO</span>
        </div>
        <div className={styles.timer}>01:36:52</div>
      </div>

      <div className={styles.right}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input type="text" placeholder="BUSCAR..." />
        </div>
        
        <button className={styles.solaraBtn} onClick={onOpenChat} title="SOLARA AI">
          <PowerSun size={32} />
        </button>

        <div className={styles.userBadge}>
          <span>H</span>
        </div>
      </div>
    </header>
  );
}
