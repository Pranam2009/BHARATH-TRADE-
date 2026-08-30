import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit')) || 100;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: unknown[] = [];

  if (action && action !== 'all') {
    query += ' AND action = ?';
    params.push(action);
  }

  if (q) {
    query += ' AND (details LIKE ? OR profile_id LIKE ? OR profile_name LIKE ? OR admin_email LIKE ?)';
    const wildcard = `%${q}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const logs = db.prepare(query).all(...params);

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  createAuditLog({
    action: 'DATABASE_EXPORT',
    details: 'Administrator exported database audit trail and profile snapshots',
    adminEmail: session.email,
    ipAddress: ip,
  });

  const profiles = db.prepare('SELECT * FROM profiles ORDER BY profile_id ASC').all();
  const documents = db.prepare('SELECT id, profile_id, doc_type, original_name, mime_type, size_bytes, created_at FROM documents').all();
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    exporter: session.email,
    platform: 'BHARATAH TRADE - Secure Business Intelligence',
    stats: {
      totalProfiles: profiles.length,
      totalDocuments: documents.length,
      totalAuditLogs: auditLogs.length,
    },
    data: {
      profiles,
      documents,
      auditLogs,
    },
  });
}
