'use client';

import React, { useState, useEffect } from 'react';
import { Download, MonitorCheck } from 'lucide-react';
import { sound } from '@/lib/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    sound.playClick();
    if (!deferredPrompt) {
      // If native prompt not available, show alert instruction
      alert('To install BHARATH TRADE:\n• Chrome/Edge: Click the Install icon in the address bar (top right)\n• Safari (iOS): Tap Share -> Add to Home Screen\n• Android: Tap menu -> Install App');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
        <MonitorCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>PWA ACTIVE</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      onMouseEnter={() => sound.playHover()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-200 text-xs font-medium"
      title="Install BHARATH TRADE as Desktop/Mobile App"
    >
      <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
      <span className="hidden sm:inline font-mono">Install BHARATH TRADE</span>
      <span className="sm:hidden font-mono">Install</span>
    </button>
  );
}
