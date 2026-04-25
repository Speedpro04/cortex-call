'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, ShieldCheck, Send } from 'lucide-react';
import Link from 'next/link';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

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
          <h2>RECUPERAR ACESSO</h2>
          <p>ENVIAREMOS UM LINK PARA SEU E-MAIL</p>
        </div>

        {!sent ? (
          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className={styles.inputGroup}>
              <label>E-MAIL CADASTRADO</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input type="email" placeholder="seu-email@clinica.com" required />
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              <Send size={18} />
              ENVIAR LINK DE RECUPERAÇÃO
            </button>
          </form>
        ) : (
          <div className={styles.successMessage}>
            <div className={styles.successBadge}>✓</div>
            <h3>E-mail enviado!</h3>
            <p>Verifique sua caixa de entrada para redefinir sua senha.</p>
            <Link href="/login" className={styles.returnButton}>
              VOLTAR AO LOGIN
            </Link>
          </div>
        )}

        <div className={styles.footer}>
          <ShieldCheck size={14} />
          <span>SISTEMA DE SEGURANÇA CORTEX</span>
        </div>
      </div>
    </div>
  );
}
