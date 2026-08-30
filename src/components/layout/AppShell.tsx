'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import CyberBackground from '@/components/3d/CyberBackground';
import { sound } from '@/lib/sound';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Inactivity session timer (30 mins default)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sound.playAlert();
        alert('Your BHARATAH TRADE intelligence session has expired due to inactivity. Please log in again.');
        fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
          router.push('/login');
        });
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [router]);

  useEffect(() => {
    // Verify active admin session
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setAdminUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <CyberBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-pulse">
            <span className="font-mono text-2xl font-black text-cyan-400">BT</span>
          </div>
          <p className="text-xs font-mono text-cyan-300 tracking-widest uppercase animate-pulse">
            Authenticating Intelligence Clearance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-x-hidden font-sans">
      {/* 3D Cyber Constellation Background */}
      <CyberBackground />

      {/* Cyber Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main App Canvas */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10
          ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}
        `}
      >
        <Header setMobileOpen={setMobileOpen} adminUser={adminUser} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
