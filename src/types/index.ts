export type ProfileStatus = 'Draft' | 'Incomplete' | 'Active' | 'Completed';

export type DocumentType = 
  | 'aadhaar_front' 
  | 'aadhaar_back' 
  | 'passport_photo' 
  | 'pan_card' 
  | 'signature';

export interface ProfileDocument {
  id: string;
  profileId: string;
  docType: DocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  profileId: string; // e.g. BT-000001
  status: ProfileStatus;
  
  // Personal Details
  fullName?: string;
  dob?: string;
  gender?: string;
  studentEmployeeId?: string;
  referralId?: string;
  email?: string;
  mobile?: string;

  // Contact Details
  country?: string;
  state?: string;
  city?: string;
  fullAddress?: string;

  // Bank Details
  bankUpiId?: string;
  payeeName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountType?: string;

  // DMAT Account Details
  dmatAgency?: string;
  dmatAccountNumber?: string;

  // KYC Details
  panNumber?: string;
  kycCompletionDate?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Associated Documents
  documents?: ProfileDocument[];
}

export type AuditAction = 
  | 'PROFILE_CREATED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_VIEWED'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'DATABASE_EXPORT';

export interface AuditLog {
  id: string;
  action: AuditAction;
  details: string;
  profileId?: string;
  profileName?: string;
  adminEmail: string;
  ipAddress: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface DashboardStats {
  totalProfiles: number;
  activeProfiles: number;
  draftProfiles: number;
  incompleteProfiles: number;
  completedProfiles: number;
  totalDocuments: number;
  recentProfiles: Profile[];
  recentAudits: AuditLog[];
}
