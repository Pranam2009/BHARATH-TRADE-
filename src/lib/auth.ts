import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { AdminUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'bharatah_trade_super_secret_cyber_intelligence_key_2026';
export const COOKIE_NAME = 'bt_admin_session';

export interface AdminSessionPayload {
  userId: string;
  username: string;
  email: string;
  exp?: number;
}

export function signAdminToken(payload: { userId: string; username: string; email: string }, expiresInSeconds = 7200): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getAdminSession(req: NextRequest): AdminSessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminFromDb(): AdminUser | null {
  const row = db.prepare('SELECT * FROM admins LIMIT 1').get() as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
  };
}
