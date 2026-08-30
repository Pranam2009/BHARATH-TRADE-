import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from '@/types';

export function createAuditLog({
  action,
  details,
  profileId,
  profileName,
  adminEmail = 'admin@bharatah.trade',
  ipAddress = '127.0.0.1',
}: {
  action: AuditAction;
  details: string;
  profileId?: string;
  profileName?: string;
  adminEmail?: string;
  ipAddress?: string;
}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, action, details, profile_id, profile_name, admin_email, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      action,
      details,
      profileId || null,
      profileName || null,
      adminEmail,
      ipAddress,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
