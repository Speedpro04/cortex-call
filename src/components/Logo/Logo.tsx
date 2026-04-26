'use client';

import React from 'react';
import styles from './logo.module.css';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  light?: boolean;
  centered?: boolean;
}

export default function Logo({ collapsed, className, light = true, centered = false }: LogoProps) {
  return (
    <div className={`${styles.logoContainer} ${centered ? styles.centered : ''} ${className || ''}`}>
      <img 
        src="/logo.png" 
        alt="Cortex Call" 
        style={{ height: collapsed ? '145px' : '175px', width: 'auto', maxWidth: 'none' }}
        className="object-contain"
      />
    </div>
  );
}
