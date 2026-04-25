'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import styles from '../register/register.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente após alguns segundos
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.loginCard} style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <CheckCircle size={64} color="#059669" />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
          Pagamento Confirmado!
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '30px' }}>
          Obrigado por assinar o Cortex Call. Sua conta está sendo preparada e o acesso será liberado em instantes.
        </p>

        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Você será redirecionado para o painel em alguns segundos...
        </p>

        <button 
          onClick={() => router.push('/dashboard')}
          className={styles.submitButton}
          style={{ marginTop: '20px' }}
        >
          ACESSAR PAINEL AGORA
        </button>
      </div>
    </div>
  );
}
