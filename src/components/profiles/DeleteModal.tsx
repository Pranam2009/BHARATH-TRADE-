'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { sound } from '@/lib/sound';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  profileId: string;
  profileName?: string;
  isDocument?: boolean;
  documentTitle?: string;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  profileId,
  profileName,
  isDocument = false,
  documentTitle,
}: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    sound.playAlert();
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-rose-500/40 p-6 md:p-8 shadow-[0_0_50px_rgba(244,63,94,0.25)] overflow-hidden">
        {/* Top glow streak */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Alert Icon */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                Permanent Purge
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {isDocument ? 'Delete Confidential Document' : 'Permanently Delete Profile'}
            </h3>
          </div>
        </div>

        {/* Body Message */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 space-y-2 mb-6">
          {isDocument ? (
            <p>
              Are you sure you want to permanently delete the document{' '}
              <strong className="text-rose-400 font-mono">
                {documentTitle || 'Selected Document'}
              </strong>{' '}
              from secure storage?
            </p>
          ) : (
            <>
              <p>
                Are you sure you want to permanently delete profile{' '}
                <strong className="text-cyan-400 font-mono">{profileId}</strong>
                {profileName ? ` (${profileName})` : ''} and all its associated documents?
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-400/90 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>This action cannot be undone. All database records and encrypted files will be purged.</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-medium text-sm shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Purging Data...' : 'Permanently Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
