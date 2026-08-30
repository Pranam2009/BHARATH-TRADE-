'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Building2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Edit3,
  Trash2,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Hash,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import NeonBadge from '@/components/ui/NeonBadge';
import DocumentViewerModal from '@/components/profiles/DocumentViewerModal';
import DeleteModal from '@/components/profiles/DeleteModal';
import { Profile, ProfileDocument } from '@/types';
import { formatDate, formatSimpleDate } from '@/lib/formatters';
import { sound } from '@/lib/sound';

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<ProfileDocument | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${id}`);
      if (!res.ok) throw new Error('Profile not found in database');
      const data = await res.json();
      setProfile(data.profile);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleCopy = (val?: string, fieldName?: string) => {
    if (!val) return;
    sound.playClick();
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName || val);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeleteProfile = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/profiles/${profile.profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sound.playSuccess();
        router.push('/profiles');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const passportDoc = profile?.documents?.find(d => d.docType === 'passport_photo');

  const renderField = (
    label: string,
    value: string | undefined | null,
    copyable = true,
    isMono = false
  ) => {
    const hasValue = value && String(value).trim().length > 0;

    return (
      <div className="space-y-1">
        <span className="text-[11px] font-mono uppercase text-slate-400">
          {label}
        </span>
        {hasValue ? (
          <div className="flex items-center justify-between gap-2 group">
            <span
              className={`text-sm text-slate-100 font-medium break-all ${
                isMono ? 'font-mono' : 'font-sans'
              }`}
            >
              {value}
            </span>
            {copyable && (
              <button
                type="button"
                onClick={() => handleCopy(value, label)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 transition-opacity p-1"
                title="Copy"
              >
                {copiedField === label ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic font-mono">Not added yet</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono text-cyan-300">
            Decrypting Intelligence Dossier...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-rose-400">Dossier Unavailable</h3>
          <p className="text-xs text-slate-400">{error || 'Profile could not be found.'}</p>
          <Link
            href="/profiles"
            className="inline-block px-5 py-2.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-mono"
          >
            ← Return to Profiles Directory
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300 print:text-black">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-4">
            <Link
              href="/profiles"
              onClick={() => sound.playClick()}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
              title="Back to Profiles"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  CONFIDENTIAL INTELLIGENCE DOSSIER
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
                {profile.fullName || (
                  <span className="text-slate-500 italic font-mono">
                    {profile.profileId} (Unnamed)
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Dossier</span>
            </button>

            <Link
              href={`/profiles/${profile.profileId}/edit`}
              onClick={() => sound.playClick()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                sound.playAlert();
                setDeleteModalOpen(true);
              }}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs transition-colors"
              title="Delete Profile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden print-dossier">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Avatar / Portrait & Main Identifiers */}
            <div className="flex items-start md:items-center gap-5">
              {/* Photo */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border-2 border-cyan-400/40 overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.2)] shrink-0 flex items-center justify-center">
                {passportDoc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/documents/${passportDoc.id}`}
                    alt={profile.fullName || profile.profileId}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setViewingDoc(passportDoc)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600">
                    <User className="w-12 h-12 text-slate-500" />
                    <span className="text-[9px] font-mono text-slate-600 uppercase mt-1">
                      No Photo
                    </span>
                  </div>
                )}
              </div>

              {/* Identity Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-mono text-sm font-bold text-cyan-400 shadow-inner">
                    <span>{profile.profileId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.profileId, 'Profile ID')}
                      className="text-slate-500 hover:text-cyan-300"
                    >
                      {copiedField === 'Profile ID' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <NeonBadge status={profile.status} size="md" />
                </div>

                <h2 className="text-2xl font-black text-white">
                  {profile.fullName || (
                    <span className="text-slate-500 italic font-mono">
                      Unnamed Profile
                    </span>
                  )}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  {profile.studentEmployeeId && (
                    <span>ID: {profile.studentEmployeeId}</span>
                  )}
                  {profile.referralId && (
                    <span>REF: {profile.referralId}</span>
                  )}
                  {(profile.city || profile.state) && (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps & Quick Meta */}
            <div className="flex flex-col md:text-right space-y-1 text-xs text-slate-400 font-mono pt-4 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto">
              <div>
                <span className="text-slate-500">Registered: </span>
                <span className="text-slate-300">{formatDate(profile.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-500">Last Modified: </span>
                <span className="text-cyan-300">{formatDate(profile.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: PERSONAL DETAILS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <User className="w-4 h-4" />
                <span>Personal Details</span>
              </div>
              <Link
                href={`/profiles/${profile.profileId}/edit`}
                className="text-xs text-slate-500 hover:text-cyan-300 font-mono"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('Full Name', profile.fullName)}
              {renderField('Date of Birth', profile.dob ? formatSimpleDate(profile.dob) : undefined, true, true)}
              {renderField('Gender', profile.gender)}
              {renderField('Employee / Student ID', profile.studentEmployeeId, true, true)}
              {renderField('Referral ID', profile.referralId, true, true)}
              {renderField('Email Address', profile.email)}
              <div className="sm:col-span-2">
                {renderField('Mobile Number', profile.mobile, true, true)}
              </div>
            </div>
          </div>

          {/* CARD 2: CONTACT DETAILS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Contact & Address</span>
              </div>
              <Link
                href={`/profiles/${profile.profileId}/edit`}
                className="text-xs text-slate-500 hover:text-cyan-300 font-mono"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('Country', profile.country)}
              {renderField('State', profile.state)}
              {renderField('City', profile.city)}
              <div className="sm:col-span-2">
                {renderField('Full Address', profile.fullAddress)}
              </div>
            </div>
          </div>

          {/* CARD 3: BANK DETAILS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>Bank Details (Unmasked)</span>
              </div>
              <Link
                href={`/profiles/${profile.profileId}/edit`}
                className="text-xs text-slate-500 hover:text-cyan-300 font-mono"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('Bank UPI ID', profile.bankUpiId, true, true)}
              {renderField('Payee Name', profile.payeeName)}
              {renderField('Bank Name', profile.bankName)}
              {renderField('Account Number', profile.accountNumber, true, true)}
              {renderField('IFSC Code', profile.ifscCode, true, true)}
              {renderField('Account Type', profile.accountType)}
            </div>
          </div>

          {/* CARD 4: DMAT ACCOUNT */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>DMAT Trading Account</span>
              </div>
              <Link
                href={`/profiles/${profile.profileId}/edit`}
                className="text-xs text-slate-500 hover:text-cyan-300 font-mono"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('Broker / Agency', profile.dmatAgency)}
              {renderField('DMAT Account / DP ID', profile.dmatAccountNumber, true, true)}
            </div>
          </div>

          {/* CARD 5: KYC COMPLIANCE */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>KYC & Compliance</span>
              </div>
              <Link
                href={`/profiles/${profile.profileId}/edit`}
                className="text-xs text-slate-500 hover:text-cyan-300 font-mono"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('PAN Number (Unmasked)', profile.panNumber, true, true)}
              {renderField('KYC Completion Date', profile.kycCompletionDate ? formatSimpleDate(profile.kycCompletionDate) : undefined, true, true)}
            </div>
          </div>

          {/* CARD 6: QUICK TELEMETRY */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Security Clearance</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">LEVEL 4</span>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Database Record:</span>
                <span className="text-slate-200">ACID SQLite Verified</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Encrypted Vault Files:</span>
                <span className="text-cyan-300">{profile.documents?.length || 0} Attached</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Access Authorization:</span>
                <span className="text-emerald-400">Super Administrator</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: CONFIDENTIAL DOCUMENTS VAULT */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Attached Confidential Documents
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {profile.documents?.length || 0} files stored in private vault
                </p>
              </div>
            </div>

            <Link
              href={`/profiles/${profile.profileId}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Upload / Replace Docs</span>
            </Link>
          </div>

          {profile.documents && profile.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => {
                    sound.playClick();
                    setViewingDoc(doc);
                  }}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-400/50 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono truncate">
                        {doc.docType.replace('_', ' ')}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {doc.originalName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(doc.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/60 transition-colors shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-slate-500 text-xs font-mono">
              No confidential documents uploaded for this profile yet.
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        profileId={profile.profileId}
        profileName={profile.fullName}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProfile}
        profileId={profile.profileId}
        profileName={profile.fullName}
      />
    </AppShell>
  );
}
