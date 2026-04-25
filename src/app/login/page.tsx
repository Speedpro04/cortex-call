'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';
import Logo from '@/components/Logo/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado ao tentar entrar.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* Logo Section */}
        <div className={styles.logoContainer}>
          <div className="flex justify-center w-full">
            <Logo light={true} centered={true} />
          </div>
        </div>

        <div className={styles.headerText} style={{ marginTop: '20px' }}>
          <h2>ACESSO AO SISTEMA</h2>
          <p>GESTÃO INTELIGENTE PARA CLÍNICAS MÉDICAS</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorDiv}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>USUÁRIO</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                placeholder="contato@clinica.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>SENHA</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'PROCESSANDO...' : 'ENTRAR NO SISTEMA'}
          </button>

          <div className={styles.extraLinks}>
            <Link href="/forgot-password" className={styles.link}>
              Esqueci minha senha
            </Link>
            <div className={styles.divider}></div>
            <Link href="/register" className={styles.link}>
              Criar nova conta
            </Link>
          </div>
        </form>

        <div className={styles.footer}>
          <ShieldCheck size={14} />
          <span>CRIPTOGRAFIA MILITAR ATIVA</span>
        </div>
      </div>
    </div>
  );
}
