-- BHARATH TRADE - Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor to enable real-time cloud sync

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  session_timeout_mins INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  profile_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Draft',
  full_name TEXT,
  dob TEXT,
  gender TEXT,
  student_employee_id TEXT,
  referral_id TEXT,
  email TEXT,
  mobile TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  city TEXT,
  full_address TEXT,
  bank_upi_id TEXT,
  payee_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_type TEXT,
  dmat_agency TEXT,
  dmat_account_number TEXT,
  pan_number TEXT,
  kyc_completion_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  profile_id TEXT,
  profile_name TEXT,
  admin_email TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
