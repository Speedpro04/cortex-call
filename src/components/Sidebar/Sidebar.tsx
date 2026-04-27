'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MessageSquare, 
  Activity, 
  Stethoscope, 
  DollarSign, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Logo from '../Logo/Logo';
import styles from './sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('GESTOR');

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name 
            || user.user_metadata?.clinic_name 
            || user.email?.split('@')[0] 
            || 'Usuário';
          setUserName(name.toUpperCase());

          // Verificar se é master
          const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || 'kd3online@gmail.com';
          if (user.email === masterEmail) {
            setUserRole('SUPER ADMIN');
          }
        } else {
          // Tentar cookie master (para bypass)
          setUserName('ADMIN');
          setUserRole('MASTER');
        }
      } catch {
        setUserName('ADMIN');
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Limpar cookies master
    document.cookie = 'master-token=; path=/; max-age=0';
    document.cookie = 'master-email=; path=/; max-age=0';
    router.push('/login');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'PAINEL', path: '/dashboard' },
    { id: 'agenda', icon: Calendar, label: 'AGENDA', path: '/dashboard/agenda' },
    { id: 'patients', icon: Users, label: 'PACIENTES', path: '/dashboard/patients' },
    { id: 'conversations', icon: MessageSquare, label: 'CONVERSAS', path: '/dashboard/conversations' },
    { id: 'recovery', icon: Activity, label: 'RECUPERAÇÃO', path: '/dashboard/recovery' },
    { id: 'campaign', icon: Zap, label: 'CAMPANHA AUTO.', path: '/dashboard/campaign' },
    { id: 'specialists', icon: Stethoscope, label: 'ESPECIALISTAS', path: '/dashboard/specialists' },
    { id: 'reports', icon: TrendingUp, label: 'RELATÓRIOS', path: '/dashboard/reports' },
    { id: 'second-brain', icon: BrainCircuit, label: 'SECOND BRAIN', path: '/dashboard/second-brain' },
    { id: 'automations', icon: Zap, label: 'AUTOMAÇÕES', path: '/dashboard/automations' },
    { id: 'finance', icon: DollarSign, label: 'FINANCEIRO', path: '/dashboard/finance' },
    { id: 'privacy', icon: ShieldCheck, label: 'PRIVACIDADE', path: '/dashboard/privacy' },
  ];


  return (
    <aside className={styles.sidebar}>
      <div className={styles.topSection}>
        <Logo />
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link 
            key={item.id} 
            href={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.bottomSection}>
        <div className={styles.userModule}>
          <div className={styles.avatar}>{userName?.charAt(0) || 'U'}</div>
          <div className={styles.userInfo}>
            <strong>{userName || 'CARREGANDO...'}</strong>
            <span>{userRole}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>ENCERRAR SESSÃO</span>
        </button>
      </div>
    </aside>
  );
}
