'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/sound';

export default function SoundToggle() {
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMuted(sound.getMuted());
  }, []);

  const handleToggle = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => sound.playHover()}
      title={muted ? 'Enable Cyber SFX' : 'Mute Cyber SFX'}
      className={`
        p-2 rounded-xl border transition-all duration-200
        ${muted
          ? 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
          : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/60 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
        }
      `}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
