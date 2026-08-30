'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'none' | 'cyan' | 'violet' | 'emerald' | 'amber';
  interactive?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  glow = 'none',
  interactive = false,
  onClick,
}: GlassCardProps) {
  const glowStyles = {
    none: '',
    cyan: 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]',
    violet: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    emerald: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    amber: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl backdrop-blur-xl
        bg-slate-900/70 border border-slate-800/80
        shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]
        ${interactive ? 'transition-all duration-300 hover:-translate-y-1 cursor-pointer' : ''}
        ${glowStyles[glow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
