'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  FileText,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import TiltCard from '@/components/3d/TiltCard';
import ProfileCard3D from '@/components/profiles/ProfileCard3D';
import DeleteModal from '@/components/profiles/DeleteModal';
import { DashboardStats, Profile } from '@/types';
import { formatDate } from '@/lib/formatters';
import { sound } from '@/lib/sound';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;
    try {
      const res = await fetch(`/api/profiles/${deletingProfile.profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sound.playSuccess();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Top Hero Section with Intelligence Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-cyan-950/40 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-2xl backdrop-blur-2xl">
          {/* Ambient Glow streak */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                  Business Intelligence System
                </span>
                <span className="text-xs font-mono text-slate-500">
                  SECURE VAULT ACTIVE
                </span>
              </div>
              <h1 className="text-2xl lg:text-4xl font-extrabold text-white">
                BHARATH TRADE <span className="text-gradient-cyan-violet">DASHBOARD</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Store, manage, update, and inspect confidential profiles and documents with zero mandatory field friction.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/profiles/new"
                onClick={() => sound.playClick()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all group"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New Profile</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/profiles"
                onClick={() => sound.playClick()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 text-xs font-mono transition-all"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>View All Profiles</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3D Animated Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Profiles */}
          <TiltCard tiltDegree={8}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-cyan-500/50 shadow-xl flex flex-col justify-between h-full group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Total Profiles
                </span>
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white font-mono">
                  {loading ? '--' : stats?.totalProfiles || 0}
                </div>
                <div className="flex items-center gap-1 text-xs text-cyan-400 font-mono mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Permanent Database Vault</span>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Card 2: Active Profiles */}
          <TiltCard tiltDegree={8}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-emerald-500/50 shadow-xl flex flex-col justify-between h-full group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Active & Verified
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white font-mono">
                  {loading ? '--' : (stats?.activeProfiles || 0) + (stats?.completedProfiles || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono mt-1">
                  <span>{stats?.completedProfiles || 0} Completed • {stats?.activeProfiles || 0} Active</span>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Card 3: Draft & Incomplete Profiles */}
          <TiltCard tiltDegree={8}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-purple-500/50 shadow-xl flex flex-col justify-between h-full group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Draft & Partial Info
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white font-mono">
                  {loading ? '--' : (stats?.draftProfiles || 0) + (stats?.incompleteProfiles || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-300 font-mono mt-1">
                  <span>{stats?.draftProfiles || 0} Drafts • {stats?.incompleteProfiles || 0} Incomplete</span>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Card 4: Total Stored Documents */}
          <TiltCard tiltDegree={8}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-indigo-500/50 shadow-xl flex flex-col justify-between h-full group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Confidential Docs
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white font-mono">
                  {loading ? '--' : stats?.totalDocuments || 0}
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-400 font-mono mt-1">
                  <span>Aadhaar, PAN, Photos & Signs</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Middle Section: Recently Updated Profiles & Security Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Recently Updated Profiles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  Recently Updated Intelligence Profiles
                </h2>
              </div>
              <Link
                href="/profiles"
                onClick={() => sound.playClick()}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Full Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : stats?.recentProfiles && stats.recentProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stats.recentProfiles.slice(0, 4).map((profile) => (
                  <ProfileCard3D
                    key={profile.id}
                    profile={profile}
                    onDeleteClick={(p) => setDeletingProfile(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
                No profiles created yet. Click Add New Profile to get started.
              </div>
            )}
          </div>

          {/* Right Col: Real-time Audit Activity Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Security Audit Log</h2>
              </div>
              <Link
                href="/audit"
                onClick={() => sound.playClick()}
                className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl p-4 shadow-xl divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
              {stats?.recentAudits && stats.recentAudits.length > 0 ? (
                stats.recentAudits.map((log) => (
                  <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {log.details}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      By: {log.adminEmail} • IP: {log.ipAddress}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No security events recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deletingProfile)}
        onClose={() => setDeletingProfile(null)}
        onConfirm={handleDeleteProfile}
        profileId={deletingProfile?.profileId || ''}
        profileName={deletingProfile?.fullName}
      />
    </AppShell>
  );
}
