'use client';

import React from 'react';
import { X, Filter, RotateCcw, Check } from 'lucide-react';
import { sound } from '@/lib/sound';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status: string;
    state: string;
    city: string;
    bank: string;
    sort: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      status: string;
      state: string;
      city: string;
      bank: string;
      sort: string;
    }>
  >;
  options: {
    statuses: string[];
    states: string[];
    cities: string[];
    banks: string[];
  };
  onReset: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  options,
  onReset,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    sound.playClick();
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Filter className="w-5 h-5" />
            <h3 className="text-base font-bold text-white font-mono">
              ADVANCED FILTERS
            </h3>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex-1 py-6 space-y-6">
          {/* Profile Status */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Profile Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'Draft', 'Incomplete', 'Active', 'Completed'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleChange('status', st)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between border transition-all
                    ${filters.status === st
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }
                  `}
                >
                  <span className="capitalize">{st === 'all' ? 'All Statuses' : st}</span>
                  {filters.status === st && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Sort Order
            </label>
            <select
              value={filters.sort}
              onChange={e => handleChange('sort', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none font-mono"
            >
              <option value="newest">Recently Updated (Newest)</option>
              <option value="oldest">Creation Date (Oldest)</option>
              <option value="profile_id_asc">Profile ID (BT-000001 → Asc)</option>
              <option value="profile_id_desc">Profile ID (Desc)</option>
              <option value="name_asc">Full Name (A - Z)</option>
            </select>
          </div>

          {/* State Filter */}
          {options.states.length > 0 && (
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Filter by State ({options.states.length})
              </label>
              <select
                value={filters.state}
                onChange={e => handleChange('state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">All States</option>
                {options.states.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* City Filter */}
          {options.cities.length > 0 && (
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Filter by City ({options.cities.length})
              </label>
              <select
                value={filters.city}
                onChange={e => handleChange('city', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">All Cities</option>
                {options.cities.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bank Filter */}
          {options.banks.length > 0 && (
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Filter by Bank ({options.banks.length})
              </label>
              <select
                value={filters.bank}
                onChange={e => handleChange('bank', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">All Banks</option>
                {options.banks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReset();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playSuccess();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
