import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = db.prepare('SELECT id, username, email, session_timeout_mins, last_login_at FROM admins WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined;

  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      sessionTimeoutMins: admin.session_timeout_mins || 60,
      lastLoginAt: admin.last_login_at,
    },
  });
}
