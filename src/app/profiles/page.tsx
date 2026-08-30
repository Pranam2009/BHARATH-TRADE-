'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Loader2,
  MapPin,
  Building2,
  Layers,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProfileCard3D from '@/components/profiles/ProfileCard3D';
import DeleteModal from '@/components/profiles/DeleteModal';
import FilterDrawer from '@/components/profiles/FilterDrawer';
import NeonBadge from '@/components/ui/NeonBadge';
import { Profile } from '@/types';
import { maskPan, maskAccountNumber, formatDate } from '@/lib/formatters';
import { sound } from '@/lib/sound';

function ProfilesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'grid' | 'table'>('3d');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);

  const [filters, setFilters] = useState({
    status: 'all',
    state: 'all',
    city: 'all',
    bank: 'all',
    sort: 'newest',
  });

  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[];
    states: string[];
    cities: string[];
    banks: string[];
  }>({
    statuses: [],
    states: [],
    cities: [],
    banks: [],
  });

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.state !== 'all') params.set('state', filters.state);
      if (filters.city !== 'all') params.set('city', filters.city);
      if (filters.bank !== 'all') params.set('bank', filters.bank);
      if (filters.sort) params.set('sort', filters.sort);

      const res = await fetch(`/api/profiles?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const data = await res.json();
      setProfiles(data.profiles || []);
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
      }
    } catch (err) {
      console.error('Fetch profiles error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      state: 'all',
      city: 'all',
      bank: 'all',
      sort: 'newest',
    });
    setSearchQuery('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProfile) return;
    try {
      const res = await fetch(`/api/profiles/${deletingProfile.profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sound.playSuccess();
        fetchProfiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all' && v !== 'newest').length + (searchQuery ? 1 : 0);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                PROFILES REPOSITORY
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                {profiles.length} Stored Intelligence Records
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
              All Intelligence Profiles
            </h1>
          </div>

          <Link
            href="/profiles/new"
            onClick={() => sound.playClick()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Profile</span>
          </Link>
        </div>

        {/* Search & Toolbar Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search profile by name..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-mono"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Right Toolbar: View Switchers & Filter Trigger */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode('3d');
                }}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  viewMode === '3d'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="3D Holographic View"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">3D</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode('table');
                }}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Filter Drawer Trigger */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setFilterDrawerOpen(true);
              }}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all
                ${activeFilterCount > 0
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title="Reset All Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Display based on View Mode */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-mono text-cyan-300 animate-pulse">
              Scanning Intelligence Database...
            </p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Profiles Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No intelligence profiles match your search criteria or active filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* VIEW 1: 3D Holographic Cards */}
            {viewMode === '3d' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                  <ProfileCard3D
                    key={profile.id}
                    profile={profile}
                    onDeleteClick={p => setDeletingProfile(p)}
                  />
                ))}
              </div>
            )}

            {/* VIEW 2: Modern Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {profile.profileId}
                        </span>
                        <NeonBadge status={profile.status} size="sm" />
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {profile.fullName || 'Unnamed Profile'}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        {profile.mobile || profile.email || 'No Contact Added'}
                      </p>
                      {profile.city && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" /> {profile.city}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <Link
                        href={`/profiles/${profile.profileId}`}
                        className="flex-1 py-1.5 text-center text-xs font-mono rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/60"
                      >
                        View
                      </Link>
                      <Link
                        href={`/profiles/${profile.profileId}/edit`}
                        className="p-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: Dense Table */}
            {viewMode === 'table' && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Profile ID</th>
                        <th className="py-3.5 px-4">Full Name</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">PAN (Masked)</th>
                        <th className="py-3.5 px-4">Account (Masked)</th>
                        <th className="py-3.5 px-4">City / State</th>
                        <th className="py-3.5 px-4">Last Updated</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                      {profiles.map(profile => (
                        <tr
                          key={profile.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                            {profile.profileId}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {profile.fullName || (
                              <span className="text-slate-500 italic font-mono text-xs">
                                Unnamed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <NeonBadge status={profile.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {maskPan(profile.panNumber)}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {maskAccountNumber(profile.accountNumber)}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {[profile.city, profile.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            {formatDate(profile.updatedAt)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/profiles/${profile.profileId}`}
                                onClick={() => sound.playClick()}
                                className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/60"
                                title="View Dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <Link
                                href={`/profiles/${profile.profileId}/edit`}
                                onClick={() => sound.playClick()}
                                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:text-white"
                                title="Edit Profile"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playAlert();
                                  setDeletingProfile(profile);
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/30 text-rose-400 border border-rose-500/30 hover:bg-rose-950/60"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deletingProfile)}
        onClose={() => setDeletingProfile(null)}
        onConfirm={handleDeleteConfirm}
        profileId={deletingProfile?.profileId || ''}
        profileName={deletingProfile?.fullName}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        options={filterOptions}
        onReset={handleResetFilters}
      />
    </AppShell>
  );
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ProfilesContent />
    </Suspense>
  );
}
