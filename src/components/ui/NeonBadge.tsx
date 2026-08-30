import React from 'react';
import { ProfileStatus } from '@/types';

interface NeonBadgeProps {
  status: ProfileStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export default function NeonBadge({ status, size = 'md', showDot = true }: NeonBadgeProps) {
  const normalized = (status || 'Draft').toLowerCase();

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';
  let label = status;

  if (normalized === 'active') {
    colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    dotColor = 'bg-emerald-400 animate-pulse';
    label = 'Active';
  } else if (normalized === 'completed') {
    colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]';
    dotColor = 'bg-cyan-400';
    label = 'Completed';
  } else if (normalized === 'incomplete') {
    colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    dotColor = 'bg-amber-400';
    label = 'Incomplete';
  } else if (normalized === 'draft') {
    colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
    dotColor = 'bg-purple-400';
    label = 'Draft';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium font-mono rounded-full border
        backdrop-blur-md transition-all duration-200 uppercase tracking-wider
        ${colorClasses}
        ${sizeClasses[size]}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {label}
    </span>
  );
}
