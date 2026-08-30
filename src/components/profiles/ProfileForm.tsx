'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  FileCheck,
  User,
  MapPin,
  Building2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Profile, ProfileStatus } from '@/types';
import { calculateProfileCompleteness } from '@/lib/formatters';
import { sound } from '@/lib/sound';
import DocumentUploader from './DocumentUploader';

interface ProfileFormProps {
  initialData?: Profile;
  isEditing?: boolean;
}

export default function ProfileForm({ initialData, isEditing = false }: ProfileFormProps) {
  const router = useRouter();

  // Form State - ALL FIELDS OPTIONAL
  const [formData, setFormData] = useState<Partial<Profile>>({
    fullName: initialData?.fullName || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    studentEmployeeId: initialData?.studentEmployeeId || '',
    referralId: initialData?.referralId || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    country: initialData?.country || 'India',
    state: initialData?.state || '',
    city: initialData?.city || '',
    fullAddress: initialData?.fullAddress || '',
    bankUpiId: initialData?.bankUpiId || '',
    payeeName: initialData?.payeeName || '',
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    ifscCode: initialData?.ifscCode || '',
    accountType: initialData?.accountType || '',
    dmatAgency: initialData?.dmatAgency || '',
    dmatAccountNumber: initialData?.dmatAccountNumber || '',
    panNumber: initialData?.panNumber || '',
    kycCompletionDate: initialData?.kycCompletionDate || '',
    status: initialData?.status || 'Draft',
  });

  const [documents, setDocuments] = useState(initialData?.documents || []);
  const [activeSection, setActiveSection] = useState<'personal' | 'contact' | 'bank' | 'dmat' | 'kyc' | 'docs'>('personal');
  const [saving, setSaving] = useState(false);
  const [statusOverridden, setStatusOverridden] = useState(Boolean(initialData?.status));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate live completeness
  const completeness = calculateProfileCompleteness({ ...formData, documents });

  useEffect(() => {
    // If admin hasn't manually overridden the status, intelligently update it
    if (!statusOverridden && !isEditing) {
      setFormData(prev => ({ ...prev, status: completeness.suggestedStatus }));
    }
  }, [formData, completeness.suggestedStatus, statusOverridden, isEditing]);

  const handleChange = (field: keyof Profile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearField = (field: keyof Profile) => {
    sound.playClick();
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async (forcedStatus?: ProfileStatus) => {
    sound.playClick();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      ...formData,
      status: forcedStatus || formData.status || completeness.suggestedStatus,
    };

    try {
      let res: Response;
      if (isEditing && initialData) {
        res = await fetch(`/api/profiles/${initialData.profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      sound.playSuccess();
      setSuccessMessage(
        isEditing
          ? `Profile ${data.profile.profileId} updated successfully.`
          : `New Profile ${data.profile.profileId} saved successfully!`
      );

      // Brief delay then navigate to view page
      setTimeout(() => {
        router.push(`/profiles/${data.profile.profileId}`);
      }, 1200);
    } catch (err: unknown) {
      sound.playAlert();
      setErrorMessage((err as Error).message || 'Failed to save profile');
      setSaving(false);
    }
  };

  const reloadDocuments = async () => {
    if (!initialData?.id && !initialData?.profileId) return;
    const targetId = initialData.profileId || initialData.id;
    try {
      const res = await fetch(`/api/profiles/${targetId}`);
      const data = await res.json();
      if (data.profile?.documents) {
        setDocuments(data.profile.documents);
      }
    } catch (err) {
      console.error('Failed to reload documents:', err);
    }
  };

  const sections = [
    { id: 'personal', label: 'Personal Details', icon: User },
    { id: 'contact', label: 'Contact Details', icon: MapPin },
    { id: 'bank', label: 'Bank Details', icon: Building2 },
    { id: 'dmat', label: 'DMAT Account', icon: TrendingUp },
    { id: 'kyc', label: 'KYC & Verification', icon: ShieldCheck },
    { id: 'docs', label: 'Documents & Photos', icon: FileText },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              router.back();
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                {isEditing ? `EDIT PROFILE: ${initialData?.profileId}` : 'NEW INTEL PROFILE CREATION'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
              {formData.fullName || (
                <span className="text-slate-500 italic font-mono">
                  {isEditing ? initialData?.profileId : 'Unnamed Profile'}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Global Save Actions (Zero Blockers - Save anytime) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-950/40 text-xs font-mono transition-all disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Intelligence...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save Profile'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-in fade-in">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-mono uppercase hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Bar: Profile Completeness & Status Selector */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        {/* Completeness Ring/Bar */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * completeness.percentage) / 100}
                className="text-cyan-400 transition-all duration-500 ease-out"
                fill="transparent"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-cyan-300">
              {completeness.percentage}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Profile Completeness
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({completeness.filledCount} fields added)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All fields are completely optional. Save with partial data anytime.
            </p>
          </div>
        </div>

        {/* Status Selector & Suggested Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Assigned Status
            </span>
            <span className="text-xs font-mono text-cyan-400">
              Suggested: {completeness.suggestedStatus}
            </span>
          </div>

          <select
            value={formData.status}
            onChange={e => {
              sound.playClick();
              setStatusOverridden(true);
              handleChange('status', e.target.value as ProfileStatus);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="Draft">Draft</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveSection(sec.id);
              }}
              onMouseEnter={() => sound.playHover()}
              className={`
                flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap border transition-all duration-200
                ${isActive
                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Form Sections */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-2xl shadow-2xl space-y-6">
        {/* SECTION 1: PERSONAL DETAILS */}
        {activeSection === 'personal' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Personal Details</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Full Name
                  </label>
                  {formData.fullName && (
                    <button
                      type="button"
                      onClick={() => handleClearField('fullName')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-sans"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Date of Birth
                  </label>
                  {formData.dob && (
                    <button
                      type="button"
                      onClick={() => handleClearField('dob')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={e => handleChange('dob', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Gender
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Select Gender (Optional)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Student / Employee ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Student ID / Employee ID
                  </label>
                  {formData.studentEmployeeId && (
                    <button
                      type="button"
                      onClick={() => handleClearField('studentEmployeeId')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.studentEmployeeId || ''}
                  onChange={e => handleChange('studentEmployeeId', e.target.value)}
                  placeholder="e.g. CORP-EXEC-8821"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* Referral ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Referral ID
                  </label>
                  {formData.referralId && (
                    <button
                      type="button"
                      onClick={() => handleClearField('referralId')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.referralId || ''}
                  onChange={e => handleChange('referralId', e.target.value)}
                  placeholder="e.g. REF-DIRECT-01"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Email Address
                  </label>
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => handleClearField('email')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="e.g. vikram.singhania@apexholding.in"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-sans"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Mobile Number
                  </label>
                  {formData.mobile && (
                    <button
                      type="button"
                      onClick={() => handleClearField('mobile')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.mobile || ''}
                  onChange={e => handleChange('mobile', e.target.value)}
                  placeholder="e.g. +91 98201 44520"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CONTACT DETAILS */}
        {activeSection === 'contact' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Contact & Address Details</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={e => handleChange('country', e.target.value)}
                  placeholder="e.g. India"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={e => handleChange('state', e.target.value)}
                  placeholder="e.g. Maharashtra, Karnataka, Delhi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru, New Delhi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Full Address */}
              <div className="space-y-1.5 md:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Full Address (Street / Building / Pincode)
                  </label>
                  {formData.fullAddress && (
                    <button
                      type="button"
                      onClick={() => handleClearField('fullAddress')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={formData.fullAddress || ''}
                  onChange={e => handleChange('fullAddress', e.target.value)}
                  placeholder="e.g. Penthouse 42B, Altamount Heights, Altamount Road, Mumbai 400026"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: BANK DETAILS */}
        {activeSection === 'bank' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Bank & Financial Details</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Bank UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Bank UPI ID
                </label>
                <input
                  type="text"
                  value={formData.bankUpiId || ''}
                  onChange={e => handleChange('bankUpiId', e.target.value)}
                  placeholder="e.g. user@okhdfcbank"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* Payee Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Payee / Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.payeeName || ''}
                  onChange={e => handleChange('payeeName', e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={e => handleChange('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={e => handleChange('accountNumber', e.target.value)}
                  placeholder="e.g. 50100239845112"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              {/* IFSC Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode || ''}
                  onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000128"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono uppercase"
                />
              </div>

              {/* Account Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  Account Type
                </label>
                <select
                  value={formData.accountType || ''}
                  onChange={e => handleChange('accountType', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Select Account Type (Optional)</option>
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                  <option value="Salary">Salary Account</option>
                  <option value="NRI/NRO">NRI / NRO Account</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: DMAT ACCOUNT */}
        {activeSection === 'dmat' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">DMAT Account Details</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* DMAT Agency */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  DMAT Broker / Agency
                </label>
                <input
                  type="text"
                  value={formData.dmatAgency || ''}
                  onChange={e => handleChange('dmatAgency', e.target.value)}
                  placeholder="e.g. Zerodha Broking, Groww, Angel One, Upstox"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* DMAT Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  DMAT Account Number / DP ID
                </label>
                <input
                  type="text"
                  value={formData.dmatAccountNumber || ''}
                  onChange={e => handleChange('dmatAccountNumber', e.target.value)}
                  placeholder="e.g. 1208160004928174"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: KYC DETAILS */}
        {activeSection === 'kyc' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">KYC & Compliance</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All fields optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* PAN Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    PAN Number
                  </label>
                  {formData.panNumber && (
                    <button
                      type="button"
                      onClick={() => handleClearField('panNumber')}
                      className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.panNumber || ''}
                  onChange={e => handleChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. AAAPS4920K"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono uppercase tracking-wider"
                />
              </div>

              {/* KYC Completion Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300">
                  KYC Completion Date
                </label>
                <input
                  type="date"
                  value={formData.kycCompletionDate || ''}
                  onChange={e => handleChange('kycCompletionDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: DOCUMENTS & PHOTOS */}
        {activeSection === 'docs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Confidential Documents & Photos</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">All uploads optional</span>
            </div>

            {isEditing && initialData ? (
              <DocumentUploader
                profileId={initialData.profileId}
                profileName={initialData.fullName}
                documents={documents}
                onDocumentsChange={reloadDocuments}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950/80 border border-cyan-500/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Document Vault Initializing
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  You can save this profile immediately (even with partial or empty information). You can upload Aadhaar, PAN, Passport photos, and signatures during initial creation or return anytime later!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono"
                  >
                    Save & Enable Document Uploads →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Status:
          </span>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {formData.status || completeness.suggestedStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save Profile'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
