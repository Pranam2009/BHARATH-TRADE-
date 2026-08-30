import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (session) {
    createAuditLog({
      action: 'AUTH_LOGOUT',
      details: `Administrator logged out (${session.email})`,
      adminEmail: session.email,
      ipAddress: ip,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
