'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Loader2,
  KeyRound,
} from 'lucide-react';
import CyberBackground from '@/components/3d/CyberBackground';
import Logo3D from '@/components/3d/Logo3D';
import SoundToggle from '@/components/ui/SoundToggle';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import { sound } from '@/lib/sound';

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('prakash');
  const [password, setPassword] = useState('690284');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      sound.playSuccess();
      router.push('/dashboard');
    } catch (err: unknown) {
      sound.playAlert();
      setError((err as Error).message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* 3D Interactive Cyber Background */}
      <CyberBackground />

      {/* Top Bar with PWA and Sound Toggle */}
      <header className="relative z-10 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo3D size="sm" />
        <div className="flex items-center gap-3">
          <PWAInstallPrompt />
          <SoundToggle />
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Glassmorphic Container */}
          <div className="relative rounded-3xl bg-slate-950/85 border border-slate-800/90 backdrop-blur-2xl p-8 shadow-[0_0_80px_rgba(0,240,255,0.15)] overflow-hidden">
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />

            {/* Header / Logo Reveal */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-4">
                <Logo3D size="lg" showText={false} />
              </div>

              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>BHARATAH</span>
                <span className="text-gradient-cyan-violet">TRADE</span>
              </h1>

              <p className="text-xs font-mono text-cyan-400 tracking-wider uppercase mt-1">
                “Secure Business Intelligence & Profile Management”
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="font-mono text-[10px] uppercase hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="prakash"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="690284"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm font-mono tracking-wider shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 group cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>LOGIN TO BHARATAH TRADE</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 p-4 text-center text-xs font-mono text-slate-600">
        BHARATAH TRADE © 2026 • Private Business Intelligence & Profile Management
      </footer>
    </div>
  );
}
