'use client';

import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import SolaraChat from '../SolaraChat/SolaraChat';
import styles from './layout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={`${styles.wrapper} custom-scrollbar`}>
        <Header onOpenChat={() => setIsChatOpen(true)} />
        <main className={styles.content}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <SolaraChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
