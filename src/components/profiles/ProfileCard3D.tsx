'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  MapPin,
  Building2,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Profile } from '@/types';
import { maskPan, maskAccountNumber, formatDate } from '@/lib/formatters';
import NeonBadge from '@/components/ui/NeonBadge';
import TiltCard from '@/components/3d/TiltCard';
import { sound } from '@/lib/sound';

interface ProfileCard3DProps {
  profile: Profile;
  onDeleteClick?: (profile: Profile) => void;
}

export default function ProfileCard3D({ profile, onDeleteClick }: ProfileCard3DProps) {
  const [copiedId, setCopiedId] = useState(false);

  const passportDoc = profile.documents?.find(d => d.docType === 'passport_photo');
  const docCount = profile.documents?.length || 0;

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sound.playClick();
    navigator.clipboard.writeText(profile.profileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <TiltCard tiltDegree={6} className="h-full">
      <div className="h-full p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-950/95 border border-slate-800 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex flex-col justify-between group transition-all duration-300">
        <div>
          {/* Top Row: Profile ID, Copy, Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="font-mono text-xs font-bold text-cyan-400">
                {profile.profileId}
              </span>
              <button
                onClick={handleCopyId}
                className="text-slate-500 hover:text-cyan-300 transition-colors p-0.5"
                title="Copy Profile ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <NeonBadge status={profile.status} size="sm" />
          </div>

          {/* Profile Header: Avatar / Photo + Name + Designation */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:border-cyan-400 transition-colors">
              {passportDoc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/documents/${passportDoc.id}`}
                  alt={profile.fullName || profile.profileId}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-cyan-400 transition-colors">
                  <User className="w-7 h-7" />
                </div>
              )}
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-scan pointer-events-none" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                {profile.fullName || (
                  <span className="text-slate-500 italic font-mono text-sm">
                    No Name Provided
                  </span>
                )}
              </h3>

              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                {profile.studentEmployeeId || profile.referralId || 'ID: Unassigned'}
              </p>

              {(profile.city || profile.state) && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Masked Sensitive Indicators */}
          <div className="space-y-2 py-3 border-y border-slate-800/80 my-3 text-xs font-mono">
            {profile.panNumber ? (
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-slate-500">PAN Number:</span>
                <span className="text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {maskPan(profile.panNumber)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-600">
                <span>PAN Number:</span>
                <span className="italic">Not added</span>
              </div>
            )}

            {profile.accountNumber ? (
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-slate-500">Bank Account:</span>
                <span className="text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {maskAccountNumber(profile.accountNumber)}
                </span>
              </div>
            ) : profile.bankName ? (
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-400" /> Bank:
                </span>
                <span className="text-slate-300 truncate max-w-[120px]">
                  {profile.bankName}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-600">
                <span>Bank Details:</span>
                <span className="italic">Not added</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span className="text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3 text-cyan-400" /> Docs Vault:
              </span>
              <span className="text-cyan-300 font-bold">
                {docCount} {docCount === 1 ? 'file' : 'files'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-600" /> Updated:
            </span>
            <span>{formatDate(profile.updatedAt)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`/profiles/${profile.profileId}`}
              onClick={() => sound.playClick()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-colors"
              title="View Dossier"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </Link>

            <Link
              href={`/profiles/${profile.profileId}/edit`}
              onClick={() => sound.playClick()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Edit</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                sound.playAlert();
                if (onDeleteClick) onDeleteClick(profile);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
              title="Delete Profile"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
