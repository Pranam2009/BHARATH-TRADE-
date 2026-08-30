import { NextRequest, NextResponse } from 'next/server';
import { db, mapRowToProfile, getDocumentsForProfile } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { AuditLog } from '@/types';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const totalProfiles = (db.prepare('SELECT COUNT(*) as c FROM profiles').get() as { c: number }).c;
  const activeProfiles = (db.prepare("SELECT COUNT(*) as c FROM profiles WHERE status = 'Active'").get() as { c: number }).c;
  const draftProfiles = (db.prepare("SELECT COUNT(*) as c FROM profiles WHERE status = 'Draft'").get() as { c: number }).c;
  const incompleteProfiles = (db.prepare("SELECT COUNT(*) as c FROM profiles WHERE status = 'Incomplete'").get() as { c: number }).c;
  const completedProfiles = (db.prepare("SELECT COUNT(*) as c FROM profiles WHERE status = 'Completed'").get() as { c: number }).c;
  const totalDocuments = (db.prepare('SELECT COUNT(*) as c FROM documents').get() as { c: number }).c;

  // Recent 5 profiles
  const recentProfileRows = db.prepare('SELECT * FROM profiles ORDER BY updated_at DESC LIMIT 5').all() as Record<string, unknown>[];
  const recentProfiles = recentProfileRows.map(r => {
    const docs = getDocumentsForProfile(String(r.id));
    return mapRowToProfile(r, docs);
  });

  // Recent 8 audit logs
  const recentAudits = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8').all() as AuditLog[];

  return NextResponse.json({
    stats: {
      totalProfiles,
      activeProfiles,
      draftProfiles,
      incompleteProfiles,
      completedProfiles,
      totalDocuments,
      recentProfiles,
      recentAudits,
    },
  });
}
