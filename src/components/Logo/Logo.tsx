'use client';

import React from 'react';
import styles from './logo.module.css';
import { PowerSun } from './PowerSun';
export { PowerSun } from './PowerSun';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  light?: boolean;
  centered?: boolean;
}

export default function Logo({ collapsed, className, light = true, centered = false }: LogoProps) {
  return (
    <div className={`${styles.logoContainer} ${centered ? styles.centered : ''} ${className || ''}`}>
      <PowerSun size={collapsed ? 40 : 55} />
      {!collapsed && (
        <div className={styles.textWrapper}>
          <span className={`${styles.brandName} ${light ? 'text-[#f1f2f6]' : 'text-[#2f3640]'}`}>
            CORTEX <span className={styles.accentText}>CALL</span>
          </span>
        </div>
      )}
    </div>
  );
}
