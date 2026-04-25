'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: '40px', background: 'white', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <div style={{ width: '50px', height: '50px', background: 'rgba(0, 98, 102, 0.1)', color: '#006266', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#2f3640' }}>PRIVACIDADE E SEGURANÇA</h2>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#535c68', letterSpacing: '1px' }}>CONFIGURAÇÕES DE PROTEÇÃO DE DADOS</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { title: 'CRIPTOGRAFIA', icon: <Lock size={20} />, desc: 'Seus dados são protegidos com criptografia de ponta a ponta.' },
            { title: 'ACESSO', icon: <Eye size={20} />, desc: 'Controle quem pode visualizar os dados da sua clínica.' },
            { title: 'TERMOS', icon: <FileText size={20} />, desc: 'Consulte nossos termos de uso e política de privacidade.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '25px', border: '1px solid #F0F2F5', borderRadius: '10px' }}>
              <div style={{ marginBottom: '15px', color: '#006266' }}>{item.icon}</div>
              <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#2f3640', marginBottom: '8px' }}>{item.title}</h4>
              <p style={{ fontSize: '14px', color: '#535c68', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
