'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Loader2,
  Calendar,
  User,
  Shield,
  Activity,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { AuditLog, AuditAction } from '@/types';
import { formatDate } from '@/lib/formatters';
import { sound } from '@/lib/sound';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'all') params.set('action', filterAction);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterAction, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    sound.playClick();
    setExporting(true);
    try {
      const res = await fetch('/api/audit', { method: 'POST' });
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bharath-trade-audit-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      sound.playSuccess();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const getActionBadgeColor = (action: AuditAction | string) => {
    switch (action) {
      case 'PROFILE_CREATED':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
      case 'PROFILE_UPDATED':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      case 'PROFILE_DELETED':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      case 'DOCUMENT_UPLOADED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
      case 'DOCUMENT_DELETED':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'AUTH_LOGIN':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40';
      case 'PASSWORD_CHANGED':
        return 'bg-orange-950/60 text-orange-300 border-orange-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
                SECURITY COMPLIANCE
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                {logs.length} Logged Events
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
              System Security & Audit Trail
            </h1>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-4 h-4 text-cyan-400" />
            )}
            <span>Export Encrypted Audit Snapshot</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit details, profile ID, admin..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Actions' },
              { id: 'PROFILE_CREATED', label: 'Created' },
              { id: 'PROFILE_UPDATED', label: 'Updated' },
              { id: 'PROFILE_DELETED', label: 'Deleted' },
              { id: 'DOCUMENT_UPLOADED', label: 'Docs Uploaded' },
              { id: 'AUTH_LOGIN', label: 'Logins' },
            ].map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFilterAction(a.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                  filterAction === a.id
                    ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-xs font-mono text-purple-300">
                Fetching Audit Trail Records...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              No audit logs match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Profile</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4">Admin Email</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                  {logs.map(log => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {log.profileId || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-200 max-w-xs md:max-w-md">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {log.adminEmail}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {log.ipAddress}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
