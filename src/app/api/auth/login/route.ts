import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { usernameOrEmail, password } = await req.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required' }, { status: 400 });
    }

    const trimmed = usernameOrEmail.trim().toLowerCase();
    const admin = db.prepare(`
      SELECT * FROM admins 
      WHERE LOWER(username) = ? OR LOWER(email) = ? 
      LIMIT 1
    `).get(trimmed, trimmed) as Record<string, unknown> | undefined;

    if (!admin) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    const isValid = bcrypt.compareSync(password, String(admin.password_hash));
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    // Update last login
    const now = new Date().toISOString();
    db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?').run(now, admin.id);

    const token = signAdminToken({
      userId: String(admin.id),
      username: String(admin.username),
      email: String(admin.email),
    }, (Number(admin.session_timeout_mins) || 60) * 60);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'AUTH_LOGIN',
      details: `Administrator logged in successfully (${admin.email})`,
      adminEmail: String(admin.email),
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        sessionTimeoutMins: admin.session_timeout_mins || 60,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: (Number(admin.session_timeout_mins) || 60) * 60,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Authentication internal server error' }, { status: 500 });
  }
}
