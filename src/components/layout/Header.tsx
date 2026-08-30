'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  LogOut,
  Shield,
  Clock,
  User,
  KeyRound,
} from 'lucide-react';
import SoundToggle from '@/components/ui/SoundToggle';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import { sound } from '@/lib/sound';

interface HeaderProps {
  setMobileOpen: (o: boolean) => void;
  adminUser?: {
    username: string;
    email: string;
  } | null;
}

export default function Header({ setMobileOpen, adminUser }: HeaderProps) {
  const router = useRouter();
  const [time, setTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sound.playClick();
    router.push(`/profiles?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    sound.playAlert();
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-950/75 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Area: Mobile Menu & Live Intelligence Clock */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            sound.playClick();
            setMobileOpen(true);
          }}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 font-mono text-xs shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{time || '--:--:--'}</span>
          <span className="text-[10px] text-cyan-500 font-semibold px-1 rounded bg-cyan-950/60 border border-cyan-500/30">
            IST
          </span>
        </div>
      </div>

      {/* Global Quick Search Input */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-md relative hidden md:block"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search profile by name..."
          className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-200 placeholder-slate-500 transition-all font-sans"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 pointer-events-none">
          ↵ ENTER
        </kbd>
      </form>

      {/* Right Area: Actions, SFX, PWA, Admin Menu */}
      <div className="flex items-center gap-3">
        <PWAInstallPrompt />
        <SoundToggle />

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              sound.playClick();
              setUserMenuOpen(!userMenuOpen);
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {adminUser?.username || 'Main Administrator'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                SECURE AUTH
              </span>
            </div>
          </button>

          {/* User Popup Modal */}
          {userMenuOpen && (
            <>
              <div
                onClick={() => setUserMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-800/80">
                  <p className="text-xs font-semibold text-white">
                    {adminUser?.username || 'Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {adminUser?.email || 'admin@bharatah.trade'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Session Active
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Security & Credentials</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/audit');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Audit Activity Log</span>
                </button>

                <div className="pt-1 border-t border-slate-800/80">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{loggingOut ? 'Terminating...' : 'Secure Logout'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
