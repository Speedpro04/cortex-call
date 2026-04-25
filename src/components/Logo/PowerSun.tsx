'use client';

import React from 'react';

interface PowerSunProps {
  size?: number;
  className?: string;
}

export const PowerSun: React.FC<PowerSunProps> = ({ size = 60, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="animate-spin-slow w-full h-full drop-shadow-[0_0_15px_rgba(255,159,67,0.7)]" style={{ animationDuration: '20s' }}>
        <defs>
          <linearGradient id="sunGradientER" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9f43" />
            <stop offset="100%" stopColor="#d35400" />
          </linearGradient>
          <filter id="glowER" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path 
          d="M50 5 L55 35 L85 20 L65 45 L95 50 L65 55 L85 80 L55 65 L50 95 L45 65 L15 80 L35 55 L5 50 L35 45 L15 20 L45 35 Z" 
          fill="url(#sunGradientER)"
          filter="url(#glowER)"
        />
        <circle cx="50" cy="50" r="15" fill="white" />
      </svg>
      {/* Camada de brilho extra pulsante */}
      <div className="absolute inset-0 rounded-full bg-orange-400/20 animate-pulse blur-xl"></div>
    </div>
  );
};

export default PowerSun;
