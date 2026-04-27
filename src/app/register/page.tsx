'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './register.module.css';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planSlug = searchParams.get('plan') || 'plan-2-especialistas';
  
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            clinic_name: clinicName,
            phone: phone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Bypass para master email (não precisa de checkout)
        if (email === 'kd3online@gmail.com') {
           router.push('/dashboard');
           return;
        }

        // 2. Chamar API do Stripe para criar sessão
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_slug: planSlug,
            clinic_name: clinicName,
            email: email,
            phone: phone,
            user_id: authData.user.id
          }),
        });

        const stripeData = await response.json();

        if (stripeData.payment_url) {
          // Redireciona para o Stripe Hosted Checkout
          window.location.href = stripeData.payment_url;
        } else {
          setError('Erro ao iniciar pagamento: ' + (stripeData.error || 'Erro desconhecido.'));
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao tentar criar sua conta e iniciar o pagamento.');
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <Link href="/login" className={styles.backButton}>
          <ArrowLeft size={16} />
          Voltar ao Login
        </Link>

        {/* Logo Section */}
        <div className={styles.logoContainer}>
          <div className="logoWrapper">
            <img src="/cortex-logo.png" alt="Cortex Call Logo" className={styles.customLogo} />
            <span className="signatureText" style={{ color: '#0ea5e9' }}>Cortex Call</span>
          </div>
        </div>

        <div className={styles.headerText}>
          <h2>CRIAR CONTA</h2>
          <p>INICIE SUA JORNADA CORTEX AGORA</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorDiv}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>NOME DA CLÍNICA</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="Ex: Clínica Sorriso Real" 
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>E-MAIL ADMINISTRATIVO</label>
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
            <label>WHATSAPP (NÚMERO OFICIAL)</label>
            <div className={styles.inputWrapper}>
              <Phone size={18} className={styles.inputIcon} />
              <input 
                type="tel" 
                placeholder="(11) 99999-9999" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>SENHA DE ACESSO</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO'}
          </button>
        </form>

        <div className={styles.footer}>
          <ShieldCheck size={14} />
          <span>DADOS PROTEGIDOS CLOUD SEGURA</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className={styles.container}><div className={styles.loginCard}><p style={{color: 'white', textAlign: 'center'}}>Carregando...</p></div></div>}>
      <RegisterForm />
    </React.Suspense>
  );
}

