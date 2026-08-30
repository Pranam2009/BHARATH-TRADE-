'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  Clock,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  User,
  Mail,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { sound } from '@/lib/sound';

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUsername(data.user.username || '');
          setEmail(data.user.email || '');
          setSessionTimeout(String(data.user.sessionTimeoutMins || '60'));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      sound.playAlert();
      setErrorMessage('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword || undefined,
          newUsername: username,
          newEmail: email,
          sessionTimeoutMins: Number(sessionTimeout),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update credentials');
      }

      sound.playSuccess();
      setSuccessMessage('Administrator credentials & security parameters saved successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      sound.playAlert();
      setErrorMessage((err as Error).message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              PLATFORM CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            System Security & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure single-administrator credentials, session expiration policies, and database parameters.
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-mono uppercase hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSaveSecurity} className="space-y-6">
          {/* Card 1: Administrator Credentials */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 text-cyan-400 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Admin Identity & Access</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Administrator Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Automatic Session Expiration Timeout
                </label>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400 shrink-0" />
                  <select
                    value={sessionTimeout}
                    onChange={e => setSessionTimeout(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="15">15 Minutes of Inactivity</option>
                    <option value="30">30 Minutes of Inactivity (Recommended)</option>
                    <option value="60">60 Minutes of Inactivity</option>
                    <option value="120">120 Minutes of Inactivity</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Password Modification */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 text-purple-400 pb-3 border-b border-slate-800">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Password Authentication</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Required to save changes"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-400 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep same"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-400 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Security Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Security Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
