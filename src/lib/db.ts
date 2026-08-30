import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Profile, ProfileDocument, AuditLog, ProfileStatus, DocumentType } from '@/types';

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'bharatah_data')
  : path.join(process.cwd(), 'data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data dir:', err);
  }
}

interface DbStore {
  admins: {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    session_timeout_mins: number;
    created_at: string;
    last_login_at?: string;
  }[];
  profiles: {
    id: string;
    profile_id: string;
    status: string;
    full_name?: string | null;
    dob?: string | null;
    gender?: string | null;
    student_employee_id?: string | null;
    referral_id?: string | null;
    email?: string | null;
    mobile?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    full_address?: string | null;
    bank_upi_id?: string | null;
    payee_name?: string | null;
    bank_name?: string | null;
    account_number?: string | null;
    ifsc_code?: string | null;
    account_type?: string | null;
    dmat_agency?: string | null;
    dmat_account_number?: string | null;
    pan_number?: string | null;
    kyc_completion_date?: string | null;
    created_at: string;
    updated_at: string;
  }[];
  documents: {
    id: string;
    profile_id: string;
    doc_type: string;
    file_name: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
    updated_at: string;
  }[];
  audit_logs: {
    id: string;
    action: string;
    details: string;
    profile_id?: string | null;
    profile_name?: string | null;
    admin_email: string;
    ip_address: string;
    timestamp: string;
  }[];
}

// In-memory persistent cache for high performance
declare global {
  // eslint-disable-next-line no-var
  var __bt_store: DbStore | undefined;
}

const DB_FILE = path.join(DATA_DIR, 'store.json');

function loadStore(): DbStore {
  if (global.__bt_store) {
    return global.__bt_store;
  }

  ensureDataDir();

  let initialStore: DbStore | null = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      initialStore = JSON.parse(content);
    }
  } catch (err) {
    console.warn('Failed to read db file, creating fresh store:', err);
  }

  if (!initialStore || !initialStore.admins) {
    initialStore = {
      admins: [],
      profiles: [],
      documents: [],
      audit_logs: [],
    };
  }

  // Ensure prakash / 690284 admin exists
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('690284', salt);

  initialStore.admins = [
    {
      id: 'admin_prakash_01',
      username: 'prakash',
      email: 'prakash@bharatah.trade',
      password_hash: hash,
      session_timeout_mins: 60,
      created_at: new Date().toISOString(),
    },
  ];

  // Remove any fake profiles (BT-000001 through BT-000005)
  initialStore.profiles = initialStore.profiles.filter(
    p => !['BT-000001', 'BT-000002', 'BT-000003', 'BT-000004', 'BT-000005'].includes(p.profile_id)
  );

  global.__bt_store = initialStore;
  saveStore(initialStore);

  return initialStore;
}

function saveStore(store: DbStore) {
  global.__bt_store = store;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist store to disk (in-memory active):', err);
  }
}

/**
 * Universal Database Interface
 */
export const db = {
  prepare(sql: string) {
    return {
      all(...params: unknown[]) {
        const store = loadStore();
        const cleanSql = sql.trim().toUpperCase();

        // 1. SELECT * FROM profiles WHERE 1=1...
        if (cleanSql.startsWith('SELECT * FROM PROFILES') || cleanSql.startsWith('SELECT P.* FROM PROFILES')) {
          let list = [...store.profiles];

          // Parse conditions
          if (sql.includes('full_name LIKE ?')) {
            const q = String(params[0] || '').replace(/%/g, '').toLowerCase();
            list = list.filter(p => (p.full_name || '').toLowerCase().includes(q) || (p.profile_id || '').toLowerCase().includes(q));
          }

          if (sql.includes('status = ?')) {
            const st = params.find(p => ['Draft', 'Incomplete', 'Active', 'Completed'].includes(String(p)));
            if (st) {
              list = list.filter(p => p.status === st);
            }
          }

          if (sql.includes('state = ?')) {
            const stateParam = params.find(p => typeof p === 'string' && p !== 'all' && !['Draft', 'Incomplete', 'Active', 'Completed'].includes(p));
            if (stateParam) {
              list = list.filter(p => p.state === stateParam);
            }
          }

          if (sql.includes('city = ?')) {
            const cityParam = params.find(p => typeof p === 'string' && p !== 'all');
            if (cityParam) {
              list = list.filter(p => p.city === cityParam);
            }
          }

          if (sql.includes('bank_name = ?')) {
            const bankParam = params.find(p => typeof p === 'string' && p !== 'all');
            if (bankParam) {
              list = list.filter(p => p.bank_name === bankParam);
            }
          }

          // Sorting
          if (sql.includes('ORDER BY created_at ASC')) {
            list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          } else if (sql.includes('ORDER BY full_name ASC')) {
            list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
          } else if (sql.includes('ORDER BY CAST(SUBSTR(profile_id')) {
            list.sort((a, b) => (a.profile_id || '').localeCompare(b.profile_id || ''));
          } else {
            list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          }

          if (sql.includes('LIMIT ?')) {
            const limit = Number(params[params.length - 1]) || 5;
            list = list.slice(0, limit);
          } else if (sql.includes('LIMIT 5')) {
            list = list.slice(0, 5);
          }

          return list as unknown as Record<string, unknown>[];
        }

        // 2. SELECT * FROM documents WHERE profile_id = ?
        if (cleanSql.includes('FROM DOCUMENTS') && cleanSql.includes('PROFILE_ID = ?')) {
          const profileId = String(params[0]);
          return store.documents.filter(d => d.profile_id === profileId) as unknown as Record<string, unknown>[];
        }

        // 3. SELECT d.*, p.profile_id FROM documents d JOIN profiles p...
        if (cleanSql.includes('FROM DOCUMENTS')) {
          const typeParam = params[0] as string | undefined;
          let list = store.documents.map(d => {
            const p = store.profiles.find(prof => prof.id === d.profile_id);
            return {
              ...d,
              owner_profile_id: p ? p.profile_id : 'BT-UNKNOWN',
              owner_name: p ? p.full_name : 'Unnamed Profile',
              owner_status: p ? p.status : 'Draft',
            };
          });

          if (typeParam && typeParam !== 'all') {
            list = list.filter(d => d.doc_type === typeParam);
          }
          list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return list as unknown as Record<string, unknown>[];
        }

        // 4. SELECT * FROM audit_logs
        if (cleanSql.includes('FROM AUDIT_LOGS')) {
          let list = [...store.audit_logs];
          if (sql.includes('action = ?')) {
            const act = params[0] as string;
            list = list.filter(l => l.action === act);
          }
          if (sql.includes('details LIKE ?')) {
            const q = String(params[0] || '').replace(/%/g, '').toLowerCase();
            list = list.filter(l => l.details.toLowerCase().includes(q) || (l.profile_id || '').toLowerCase().includes(q) || (l.profile_name || '').toLowerCase().includes(q));
          }
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (sql.includes('LIMIT ?')) {
            const limit = Number(params[params.length - 1]) || 100;
            list = list.slice(0, limit);
          } else if (sql.includes('LIMIT 8')) {
            list = list.slice(0, 8);
          }
          return list as unknown as Record<string, unknown>[];
        }

        // 5. Distinct queries
        if (cleanSql.includes('DISTINCT STATUS')) {
          const distinct = Array.from(new Set(store.profiles.map(p => p.status).filter(Boolean)));
          return distinct.map(status => ({ status }));
        }
        if (cleanSql.includes('DISTINCT STATE')) {
          const distinct = Array.from(new Set(store.profiles.map(p => p.state).filter(Boolean)));
          return distinct.map(state => ({ state }));
        }
        if (cleanSql.includes('DISTINCT CITY')) {
          const distinct = Array.from(new Set(store.profiles.map(p => p.city).filter(Boolean)));
          return distinct.map(city => ({ city }));
        }
        if (cleanSql.includes('DISTINCT BANK_NAME')) {
          const distinct = Array.from(new Set(store.profiles.map(p => p.bank_name).filter(Boolean)));
          return distinct.map(bank_name => ({ bank_name }));
        }

        return [] as unknown as Record<string, unknown>[];
      },

      get(...params: unknown[]) {
        const store = loadStore();
        const cleanSql = sql.trim().toUpperCase();

        // 1. SELECT * FROM admins WHERE ...
        if (cleanSql.includes('FROM ADMINS')) {
          if (params.length >= 2) {
            const usernameOrEmail = String(params[0]).toLowerCase();
            return store.admins.find(
              a => a.username.toLowerCase() === usernameOrEmail || a.email.toLowerCase() === usernameOrEmail
            );
          }
          if (params.length === 1) {
            const idOrUser = String(params[0]);
            return store.admins.find(a => a.id === idOrUser || a.username === idOrUser || a.email === idOrUser);
          }
          return store.admins[0];
        }

        // 2. SELECT * FROM profiles WHERE id = ? OR profile_id = ?
        if (cleanSql.includes('FROM PROFILES')) {
          if (cleanSql.includes('COUNT(*)')) {
            if (cleanSql.includes("STATUS = 'ACTIVE'")) {
              return { c: store.profiles.filter(p => p.status === 'Active').length };
            }
            if (cleanSql.includes("STATUS = 'DRAFT'")) {
              return { c: store.profiles.filter(p => p.status === 'Draft').length };
            }
            if (cleanSql.includes("STATUS = 'INCOMPLETE'")) {
              return { c: store.profiles.filter(p => p.status === 'Incomplete').length };
            }
            if (cleanSql.includes("STATUS = 'COMPLETED'")) {
              return { c: store.profiles.filter(p => p.status === 'Completed').length };
            }
            return { c: store.profiles.length, count: store.profiles.length };
          }

          const targetId = String(params[0]);
          return store.profiles.find(p => p.id === targetId || p.profile_id === targetId);
        }

        // 3. SELECT * FROM documents WHERE id = ?
        if (cleanSql.includes('FROM DOCUMENTS')) {
          if (cleanSql.includes('COUNT(*)')) {
            return { c: store.documents.length, count: store.documents.length };
          }
          if (cleanSql.includes('DOC_TYPE = ?')) {
            const profileId = String(params[0]);
            const docType = String(params[1]);
            return store.documents.find(d => d.profile_id === profileId && d.doc_type === docType);
          }
          const docId = String(params[0]);
          const doc = store.documents.find(d => d.id === docId);
          if (doc) {
            const prof = store.profiles.find(p => p.id === doc.profile_id);
            return {
              ...doc,
              owner_profile_id: prof?.profile_id,
              owner_name: prof?.full_name,
            };
          }
          return undefined;
        }

        return undefined;
      },

      run(...params: unknown[]) {
        const store = loadStore();
        const cleanSql = sql.trim().toUpperCase();

        // 1. UPDATE admins SET ...
        if (cleanSql.startsWith('UPDATE ADMINS')) {
          if (cleanSql.includes('LAST_LOGIN_AT')) {
            const lastLogin = String(params[0]);
            const adminId = String(params[1]);
            const admin = store.admins.find(a => a.id === adminId);
            if (admin) {
              admin.last_login_at = lastLogin;
              saveStore(store);
            }
            return { changes: 1 };
          }

          if (cleanSql.includes('SET USERNAME = ?')) {
            const [username, email, password_hash, session_timeout_mins, id] = params as [string, string, string, number, string];
            const admin = store.admins.find(a => a.id === id) || store.admins[0];
            if (admin) {
              admin.username = username;
              admin.email = email;
              admin.password_hash = password_hash;
              admin.session_timeout_mins = session_timeout_mins;
              saveStore(store);
            }
            return { changes: 1 };
          }
        }

        // 2. INSERT INTO profiles
        if (cleanSql.startsWith('INSERT INTO PROFILES')) {
          const [
            id, profile_id, status, full_name, dob, gender, student_employee_id, referral_id,
            email, mobile, country, state, city, full_address, bank_upi_id, payee_name,
            bank_name, account_number, ifsc_code, account_type, dmat_agency,
            dmat_account_number, pan_number, kyc_completion_date, created_at, updated_at
          ] = params as (string | null)[];

          store.profiles.push({
            id: String(id),
            profile_id: String(profile_id),
            status: String(status || 'Draft'),
            full_name,
            dob,
            gender,
            student_employee_id,
            referral_id,
            email,
            mobile,
            country,
            state,
            city,
            full_address,
            bank_upi_id,
            payee_name,
            bank_name,
            account_number,
            ifsc_code,
            account_type,
            dmat_agency,
            dmat_account_number,
            pan_number,
            kyc_completion_date,
            created_at: String(created_at),
            updated_at: String(updated_at),
          });

          saveStore(store);
          return { changes: 1 };
        }

        // 3. UPDATE profiles
        if (cleanSql.startsWith('UPDATE PROFILES')) {
          if (cleanSql.includes('SET UPDATED_AT = ? WHERE ID = ?')) {
            const updatedAt = String(params[0]);
            const id = String(params[1]);
            const p = store.profiles.find(prof => prof.id === id);
            if (p) {
              p.updated_at = updatedAt;
              saveStore(store);
            }
            return { changes: 1 };
          }

          const [
            status, full_name, dob, gender, student_employee_id, referral_id,
            email, mobile, country, state, city, full_address, bank_upi_id, payee_name,
            bank_name, account_number, ifsc_code, account_type, dmat_agency,
            dmat_account_number, pan_number, kyc_completion_date, updated_at, id
          ] = params as (string | null)[];

          const pIndex = store.profiles.findIndex(prof => prof.id === String(id));
          if (pIndex !== -1) {
            store.profiles[pIndex] = {
              ...store.profiles[pIndex],
              status: String(status || store.profiles[pIndex].status),
              full_name,
              dob,
              gender,
              student_employee_id,
              referral_id,
              email,
              mobile,
              country,
              state,
              city,
              full_address,
              bank_upi_id,
              payee_name,
              bank_name,
              account_number,
              ifsc_code,
              account_type,
              dmat_agency,
              dmat_account_number,
              pan_number,
              kyc_completion_date,
              updated_at: String(updated_at),
            };
            saveStore(store);
          }
          return { changes: 1 };
        }

        // 4. DELETE FROM profiles
        if (cleanSql.startsWith('DELETE FROM PROFILES')) {
          const id = String(params[0]);
          store.profiles = store.profiles.filter(p => p.id !== id && p.profile_id !== id);
          saveStore(store);
          return { changes: 1 };
        }

        // 5. INSERT INTO documents
        if (cleanSql.startsWith('INSERT INTO DOCUMENTS')) {
          const [id, profile_id, doc_type, file_name, original_name, mime_type, size_bytes, created_at, updated_at] = params as (string | number)[];
          store.documents.push({
            id: String(id),
            profile_id: String(profile_id),
            doc_type: String(doc_type),
            file_name: String(file_name),
            original_name: String(original_name),
            mime_type: String(mime_type),
            size_bytes: Number(size_bytes),
            created_at: String(created_at),
            updated_at: String(updated_at),
          });
          saveStore(store);
          return { changes: 1 };
        }

        // 6. DELETE FROM documents
        if (cleanSql.startsWith('DELETE FROM DOCUMENTS')) {
          const id = String(params[0]);
          store.documents = store.documents.filter(d => d.id !== id && d.profile_id !== id);
          saveStore(store);
          return { changes: 1 };
        }

        // 7. INSERT INTO audit_logs
        if (cleanSql.startsWith('INSERT INTO AUDIT_LOGS')) {
          const [id, action, details, profile_id, profile_name, admin_email, ip_address, timestamp] = params as (string | null)[];
          store.audit_logs.unshift({
            id: String(id || uuidv4()),
            action: String(action),
            details: String(details),
            profile_id: profile_id || null,
            profile_name: profile_name || null,
            admin_email: String(admin_email),
            ip_address: String(ip_address || '127.0.0.1'),
            timestamp: String(timestamp || new Date().toISOString()),
          });
          saveStore(store);
          return { changes: 1 };
        }

        return { changes: 0 };
      },
    };
  },
};

/**
 * Generate Next Profile ID: BT-000001, BT-000002...
 */
export function generateNextProfileId(): string {
  const store = loadStore();
  if (store.profiles.length === 0) {
    return 'BT-000001';
  }

  let maxNum = 0;
  for (const p of store.profiles) {
    const match = p.profile_id.match(/BT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
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
    kycCompletionDate: row.kycCompletionDate ? String(row.kyc_completion_date) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    documents: docs,
  };
}

export function getDocumentsForProfile(profileId: string): ProfileDocument[] {
  const store = loadStore();
  const rows = store.documents.filter(d => d.profile_id === profileId);

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
