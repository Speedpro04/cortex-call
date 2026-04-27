import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#f8fafc',
      gap: '20px'
    }}>
      <Loader2 size={48} color="#2d5a4c" style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '14px', 
          fontWeight: 900, 
          color: '#2d5a4c', 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}>
          Sincronizando Cortex
        </h2>
        <p style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: '#64748b',
          letterSpacing: '1px'
        }}>
          PREPARANDO AMBIENTE DE INTELIGÊNCIA...
        </p>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
