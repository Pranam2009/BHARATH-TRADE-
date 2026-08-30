'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';
import Logo3D from '@/components/3d/Logo3D';
import { sound } from '@/lib/sound';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'All Profiles', href: '/profiles', icon: Users },
    { label: 'Add Profile', href: '/profiles/new', icon: UserPlus },
    { label: 'Document Vault', href: '/documents', icon: FileText },
    { label: 'Security Audit', href: '/audit', icon: ShieldAlert },
    { label: 'System Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          transition-all duration-300 ease-in-out
          flex flex-col bg-slate-950/80 backdrop-blur-2xl
          border-r border-slate-800/80 shadow-[10px_0_30px_rgba(0,0,0,0.5)]
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Branding */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            href="/dashboard"
            onClick={() => sound.playClick()}
            className="flex items-center gap-3 overflow-hidden"
          >
            <Logo3D size={collapsed ? 'sm' : 'md'} showText={!collapsed} />
          </Link>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => {
              sound.playClick();
              setCollapsed(!collapsed);
            }}
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Security Tier Tag */}
        {!collapsed && (
          <div className="px-4 py-2.5 mx-3 mt-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono text-cyan-300 font-semibold tracking-wider">
                ADMIN ACCESS ONLY
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  sound.playClick();
                  setMobileOpen(false);
                }}
                onMouseEnter={() => sound.playHover()}
                className={`
                  relative flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_#00f0ff]" />
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />

                {!collapsed && (
                  <span className="text-sm tracking-wide font-sans">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Intelligence Info */}
        <div className="p-3 border-t border-slate-800/80">
          {!collapsed ? (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-slate-300">SQLite Engine</span>
                  <span className="text-[9px] text-emerald-400 font-mono">WAL Mode Active</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">v2.4</span>
            </div>
          ) : (
            <div className="flex justify-center p-2" title="SQLite Engine v2.4">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
