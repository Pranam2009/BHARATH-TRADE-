import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, newUsername, newEmail, sessionTimeoutMins } = await req.json();

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined;
    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    // If changing password or sensitive profile details, verify current password
    if (newPassword || newUsername || newEmail) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to save security changes' }, { status: 400 });
      }

      const isValid = bcrypt.compareSync(currentPassword, String(admin.password_hash));
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    let updatedHash = admin.password_hash;
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
      }
      const salt = bcrypt.genSaltSync(10);
      updatedHash = bcrypt.hashSync(newPassword, salt);
    }

    const updatedUsername = newUsername?.trim() || admin.username;
    const updatedEmail = newEmail?.trim() || admin.email;
    const updatedTimeout = Number(sessionTimeoutMins) || admin.session_timeout_mins || 60;

    db.prepare(`
      UPDATE admins 
      SET username = ?, email = ?, password_hash = ?, session_timeout_mins = ?
      WHERE id = ?
    `).run(updatedUsername, updatedEmail, updatedHash, updatedTimeout, admin.id);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'PASSWORD_CHANGED',
      details: 'Administrator credentials / security parameters updated',
      adminEmail: session.email,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Security credentials updated successfully',
      user: {
        id: admin.id,
        username: updatedUsername,
        email: updatedEmail,
        sessionTimeoutMins: updatedTimeout,
      },
    });
  } catch (err: unknown) {
    console.error('Password update error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to update credentials' }, { status: 500 });
  }
}
