'use client';

import React from 'react';
import { Sparkles, Bell, Search, Settings, Headset } from 'lucide-react';
import Logo from '../Logo/Logo';
import styles from './header.module.css';

interface HeaderProps {
  onOpenChat?: () => void;
}

export default function Header({ onOpenChat }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleSection}>
          <h1>Dashboard</h1>
          <p>BEM-VINDO DE VOLTA</p>
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
        
        <button className={styles.solaraCard} onClick={onOpenChat}>
          <div className={styles.solaraCardIcon}>
            <Headset size={20} />
          </div>
          <div className={styles.solaraCardText}>
            <strong>Solara Cortex</strong>
            <span>Suporte & Atendimento</span>
          </div>
        </button>

        <div className={styles.userBadge}>
          <span>H</span>
        </div>
      </div>
    </header>
  );
}
