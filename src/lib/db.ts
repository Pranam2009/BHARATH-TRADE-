import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Profile, ProfileDocument, AuditLog, ProfileStatus, DocumentType } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'bharatah.db');

// Global singleton for better-sqlite3 in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __bt_db: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __bt_schema_init: boolean | undefined;
}

export function getDatabase(): Database.Database {
  if (!global.__bt_db) {
    global.__bt_db = new Database(DB_PATH, { timeout: 10000 });
    try {
      global.__bt_db.pragma('journal_mode = WAL');
      global.__bt_db.pragma('foreign_keys = ON');
      global.__bt_db.pragma('busy_timeout = 10000');
    } catch {
      // Ignored if busy in worker
    }
    if (!global.__bt_schema_init) {
      try {
        initSchema(global.__bt_db);
        global.__bt_schema_init = true;
      } catch (err) {
        console.warn('Schema init deferred:', err);
      }
    }
  }
  return global.__bt_db;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDatabase();
    const val = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(instance);
    }
    return val;
  },
});


function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      session_timeout_mins INTEGER DEFAULT 60,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      profile_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft',
      full_name TEXT,
      dob TEXT,
      gender TEXT,
      student_employee_id TEXT,
      referral_id TEXT,
      email TEXT,
      mobile TEXT,
      country TEXT,
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      profile_id TEXT,
      profile_name TEXT,
      admin_email TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
    CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles(mobile);
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_pan ON profiles(pan_number);
    CREATE INDEX IF NOT EXISTS idx_documents_profile ON documents(profile_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
  `);

  seedInitialData(database);
}

function seedInitialData(database: Database.Database) {
  // Check if admin exists or update admin
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('690284', salt);

  database.prepare(`
    DELETE FROM admins;
  `).run();

  database.prepare(`
    INSERT INTO admins (id, username, email, password_hash, session_timeout_mins, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    'prakash',
    'prakash@bharatah.trade',
    hash,
    60,
    new Date().toISOString()
  );

  // Clean out any old dummy profiles (BT-000001 through BT-000005)
  database.prepare(`
    DELETE FROM profiles WHERE profile_id IN ('BT-000001', 'BT-000002', 'BT-000003', 'BT-000004', 'BT-000005');
  `).run();
}

/**
 * Generate Next Profile ID: BT-000001, BT-000002...
 */
export function generateNextProfileId(): string {
  const row = db.prepare(`
    SELECT profile_id FROM profiles 
    WHERE profile_id LIKE 'BT-%' 
    ORDER BY CAST(SUBSTR(profile_id, 4) AS INTEGER) DESC 
    LIMIT 1
  `).get() as { profile_id: string } | undefined;

  if (!row || !row.profile_id) {
    return 'BT-000001';
  }

  const match = row.profile_id.match(/BT-(\d+)/);
  if (!match) return 'BT-000001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `BT-${String(nextNum).padStart(6, '0')}`;
}

export function mapRowToProfile(row: Record<string, unknown>, docs: ProfileDocument[] = []): Profile {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    status: (row.status as ProfileStatus) || 'Draft',
    fullName: row.full_name ? String(row.full_name) : undefined,
    dob: row.dob ? String(row.dob) : undefined,
    gender: row.gender ? String(row.gender) : undefined,
    studentEmployeeId: row.student_employee_id ? String(row.student_employee_id) : undefined,
    referralId: row.referral_id ? String(row.referral_id) : undefined,
    email: row.email ? String(row.email) : undefined,
    mobile: row.mobile ? String(row.mobile) : undefined,
    country: row.country ? String(row.country) : undefined,
    state: row.state ? String(row.state) : undefined,
    city: row.city ? String(row.city) : undefined,
    fullAddress: row.full_address ? String(row.full_address) : undefined,
    bankUpiId: row.bank_upi_id ? String(row.bank_upi_id) : undefined,
    payeeName: row.payee_name ? String(row.payee_name) : undefined,
    bankName: row.bank_name ? String(row.bank_name) : undefined,
    accountNumber: row.account_number ? String(row.account_number) : undefined,
    ifscCode: row.ifsc_code ? String(row.ifsc_code) : undefined,
    accountType: row.account_type ? String(row.account_type) : undefined,
    dmatAgency: row.dmat_agency ? String(row.dmat_agency) : undefined,
    dmatAccountNumber: row.dmat_account_number ? String(row.dmat_account_number) : undefined,
    panNumber: row.pan_number ? String(row.pan_number) : undefined,
    kycCompletionDate: row.kyc_completion_date ? String(row.kyc_completion_date) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    documents: docs,
  };
}

export function getDocumentsForProfile(profileId: string): ProfileDocument[] {
  const rows = db.prepare(`
    SELECT * FROM documents WHERE profile_id = ? ORDER BY created_at ASC
  `).all(profileId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    profileId: String(r.profile_id),
    docType: r.doc_type as DocumentType,
    fileName: String(r.file_name),
    originalName: String(r.original_name),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
}
