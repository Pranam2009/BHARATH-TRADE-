'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animate?: boolean;
}

export default function Logo3D({ size = 'md', showText = true, animate = true }: Logo3DProps) {
  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-11 h-11', text: 'text-xl', sub: 'text-[11px]' },
    lg: { box: 'w-16 h-16', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-24 h-24', text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* 3D Holographic Emblem */}
      <div className={`relative ${currentSize.box} flex items-center justify-center`}>
        {/* Outer Rotating Cyber Ring */}
        {animate ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-xl border border-cyan-400/30 border-dashed"
          />
        ) : (
          <div className="absolute inset-0 rounded-xl border border-cyan-400/30 border-dashed" />
        )}

        {/* Middle Pulse Ring */}
        <div className="absolute inset-1 rounded-lg bg-gradient-to-tr from-cyan-500/20 via-indigo-600/30 to-purple-600/20 blur-[2px]" />

        {/* Central Core Shield */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-cyan-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)] overflow-hidden">
          {/* Holographic light streak */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />

          {/* Futuristic Monogram BT */}
          <span className="font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 drop-shadow-[0_2px_8px_rgba(0,240,255,0.6)] font-mono">
            BT
          </span>

          {/* Micro Corner Accents */}
          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-purple-400" />
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-wider ${currentSize.text} leading-none flex items-center gap-1.5`}>
            <span className="text-white">BHARATH</span>
            <span className="text-cyan-400">TRADE</span>
          </div>
          <span className={`text-slate-400 font-mono tracking-widest uppercase ${currentSize.sub} mt-0.5`}>
            Intelligence Vault
          </span>
        </div>
      )}
    </div>
  );
}
