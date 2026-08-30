import { Profile, ProfileStatus } from '@/types';

/**
 * Mask PAN Number: ABCDE1234F -> ABCDE****F or ABCDE****
 */
export function maskPan(pan?: string | null): string {
  if (!pan) return '—';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 5) return clean;
  return `${clean.slice(0, 5)}****${clean.slice(9) || ''}`;
}

/**
 * Mask Bank Account Number: 123456789012 -> ••••••••9012
 */
export function maskAccountNumber(acc?: string | null): string {
  if (!acc) return '—';
  const clean = acc.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `${'•'.repeat(Math.max(4, clean.length - 4))}${last4}`;
}

/**
 * Mask Mobile Number: +91 9876543210 -> +91 98••• ••210
 */
export function maskMobile(mobile?: string | null): string {
  if (!mobile) return '—';
  const clean = mobile.trim();
  if (clean.length <= 6) return clean;
  return `${clean.slice(0, 4)}••••${clean.slice(-3)}`;
}

/**
 * Mask Email: johndoe@company.com -> j•••e@company.com
 */
export function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  return `${local[0]}•••${local[local.length - 1]}@${domain}`;
}

/**
 * Compute intelligent profile status based on completeness
 */
export function calculateProfileCompleteness(profile: Partial<Profile>): {
  percentage: number;
  suggestedStatus: ProfileStatus;
  filledCount: number;
  totalFields: number;
} {
  const fieldsToCheck = [
    profile.fullName,
    profile.dob,
    profile.gender,
    profile.studentEmployeeId,
    profile.referralId,
    profile.email,
    profile.mobile,
    profile.country,
    profile.state,
    profile.city,
    profile.fullAddress,
    profile.bankUpiId,
    profile.payeeName,
    profile.bankName,
    profile.accountNumber,
    profile.ifscCode,
    profile.accountType,
    profile.dmatAgency,
    profile.dmatAccountNumber,
    profile.panNumber,
    profile.kycCompletionDate,
  ];

  const totalFields = fieldsToCheck.length;
  const filledCount = fieldsToCheck.filter(f => f && String(f).trim().length > 0).length;
  const docCount = profile.documents ? profile.documents.length : 0;

  const percentage = Math.min(100, Math.round(((filledCount + docCount * 2) / (totalFields + 10)) * 100));

  let suggestedStatus: ProfileStatus = 'Draft';
  if (filledCount >= 14 && docCount >= 3) {
    suggestedStatus = 'Completed';
  } else if (filledCount >= 6 || (profile.fullName && profile.mobile && profile.panNumber)) {
    suggestedStatus = 'Active';
  } else if (filledCount >= 2) {
    suggestedStatus = 'Incomplete';
  } else {
    suggestedStatus = 'Draft';
  }

  return {
    percentage,
    suggestedStatus,
    filledCount,
    totalFields,
  };
}

/**
 * Format Date to readable string
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatSimpleDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}
