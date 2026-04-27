'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

type ViewState = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estados dos campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Master Bypass — validação segura via API server-side
    try {
      const masterRes = await fetch('/api/auth/master-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const masterData = await masterRes.json();
      if (masterData.isMaster) {
        window.location.href = '/dashboard';
        return;
      }
    } catch (masterErr) {
      // Se falhar, continua com login normal
      console.warn('Master check unavailable, proceeding with normal login');
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Erro ao tentar conectar ao sistema.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
      setTimeout(() => setView('login'), 3000);
    } catch (err) {
      setError('Erro ao criar conta.');
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('Link de recuperação enviado para seu e-mail!');
      }
    } catch (err) {
      setError('Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Imagem de Fundo (Opacidade 0.3) */}
      <div className={styles.bgImage}></div>

      {/* Lado Esquerdo (Formulário Branco Premium) */}
      <div className={styles.formPane}>
        <div className={styles.loginCard}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="Cortex Call" style={{ height: '280px', width: 'auto' }} />
          </div>

          {error && <div className={styles.errorDiv}><AlertCircle size={16} /> {error}</div>}
          {success && <div className={styles.successDiv}>{success}</div>}

          {view === 'login' && (
            <div className={styles.contentWrapper}>
              <div className={styles.headerText}>
                <h2>ACESSO RESTRITO</h2>
                <p>Bem-vindo ao portal da sua clínica</p>
              </div>

              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.inputGroup}>
                  <label>E-MAIL CORPORATIVO</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={20} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>SENHA DE ACESSO</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={20} />
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
                  {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
                </button>
              </form>

              <div className={styles.extraLinks}>
                <button type="button" onClick={() => setView('forgot')} className={styles.link}>
                  Esqueci minha senha
                </button>
                <div className={styles.divider}></div>
                <button type="button" onClick={() => setView('register')} className={styles.link}>
                  Solicitar Cadastro
                </button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className={styles.contentWrapper}>
              <div className={styles.headerText}>
                <h2>CRIAR CONTA</h2>
                <p>O futuro da sua clínica começa aqui</p>
              </div>

              <form className={styles.form} onSubmit={handleRegister}>
                <div className={styles.inputGroup}>
                  <label>NOME COMPLETO</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={20} />
                    <input 
                      type="text" 
                      placeholder="Dr. Nome Sobrenome" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>E-MAIL CORPORATIVO</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={20} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>SENHA</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={20} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Crie sua senha" 
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
                  {loading ? 'PROCESSANDO...' : 'CADASTRAR AGORA'}
                </button>
              </form>

              <button onClick={() => setView('login')} className={styles.backButton}>
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </div>
          )}

          {view === 'forgot' && (
            <div className={styles.contentWrapper}>
              <div className={styles.headerText}>
                <h2>RECUPERAR ACESSO</h2>
                <p>Enviaremos as instruções por e-mail</p>
              </div>

              <form className={styles.form} onSubmit={handleForgot}>
                <div className={styles.inputGroup}>
                  <label>E-MAIL CADASTRADO</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={20} />
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
                </button>
              </form>

              <button onClick={() => setView('login')} className={styles.backButton}>
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </div>
          )}

          <div className={styles.footer}>
            <ShieldCheck size={16} />
            <span>AMBIENTE 100% SEGURO E CRIPTOGRAFADO</span>
          </div>
        </div>
      </div>

      {/* Lado Direito (Foco na Imagem com Cadeado de Segurança Poderoso) */}
      <div className={styles.emptyPane}>
        <div className={styles.lockOverlay}>
          <Lock size={160} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
