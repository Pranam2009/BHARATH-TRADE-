import { NextRequest, NextResponse } from 'next/server';
import { db, mapRowToProfile, getDocumentsForProfile } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { deleteSecureDocument } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const row = db.prepare(`
    SELECT * FROM profiles 
    WHERE id = ? OR profile_id = ? 
    LIMIT 1
  `).get(id, id) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const docs = getDocumentsForProfile(String(row.id));
  const profile = mapRowToProfile(row, docs);

  return NextResponse.json({ profile });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = db.prepare(`
      SELECT * FROM profiles 
      WHERE id = ? OR profile_id = ? 
      LIMIT 1
    `).get(id, id) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const internalId = String(existing.id);
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE profiles SET
        status = ?,
        full_name = ?,
        dob = ?,
        gender = ?,
        student_employee_id = ?,
        referral_id = ?,
        email = ?,
        mobile = ?,
        country = ?,
        state = ?,
        city = ?,
        full_address = ?,
        bank_upi_id = ?,
        payee_name = ?,
        bank_name = ?,
        account_number = ?,
        ifsc_code = ?,
        account_type = ?,
        dmat_agency = ?,
        dmat_account_number = ?,
        pan_number = ?,
        kyc_completion_date = ?,
        updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      body.status || existing.status,
      body.fullName !== undefined ? (body.fullName?.trim() || null) : existing.full_name,
      body.dob !== undefined ? (body.dob?.trim() || null) : existing.dob,
      body.gender !== undefined ? (body.gender?.trim() || null) : existing.gender,
      body.studentEmployeeId !== undefined ? (body.studentEmployeeId?.trim() || null) : existing.student_employee_id,
      body.referralId !== undefined ? (body.referralId?.trim() || null) : existing.referral_id,
      body.email !== undefined ? (body.email?.trim() || null) : existing.email,
      body.mobile !== undefined ? (body.mobile?.trim() || null) : existing.mobile,
      body.country !== undefined ? (body.country?.trim() || null) : existing.country,
      body.state !== undefined ? (body.state?.trim() || null) : existing.state,
      body.city !== undefined ? (body.city?.trim() || null) : existing.city,
      body.fullAddress !== undefined ? (body.fullAddress?.trim() || null) : existing.full_address,
      body.bankUpiId !== undefined ? (body.bankUpiId?.trim() || null) : existing.bank_upi_id,
      body.payeeName !== undefined ? (body.payeeName?.trim() || null) : existing.payee_name,
      body.bankName !== undefined ? (body.bankName?.trim() || null) : existing.bank_name,
      body.accountNumber !== undefined ? (body.accountNumber?.trim() || null) : existing.account_number,
      body.ifscCode !== undefined ? (body.ifscCode?.trim() || null) : existing.ifsc_code,
      body.accountType !== undefined ? (body.accountType?.trim() || null) : existing.account_type,
      body.dmatAgency !== undefined ? (body.dmatAgency?.trim() || null) : existing.dmat_agency,
      body.dmatAccountNumber !== undefined ? (body.dmatAccountNumber?.trim() || null) : existing.dmat_account_number,
      body.panNumber !== undefined ? (body.panNumber?.trim()?.toUpperCase() || null) : existing.pan_number,
      body.kycCompletionDate !== undefined ? (body.kycCompletionDate?.trim() || null) : existing.kyc_completion_date,
      now,
      internalId
    );

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'PROFILE_UPDATED',
      details: `Updated profile ${existing.profile_id} (${body.fullName || existing.full_name || 'No Name'})`,
      profileId: String(existing.profile_id),
      profileName: String(body.fullName || existing.full_name || existing.profile_id),
      adminEmail: session.email,
      ipAddress: ip,
    });

    const updatedRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(internalId) as Record<string, unknown>;
    const docs = getDocumentsForProfile(internalId);
    const updatedProfile = mapRowToProfile(updatedRow, docs);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = db.prepare(`
      SELECT * FROM profiles 
      WHERE id = ? OR profile_id = ? 
      LIMIT 1
    `).get(id, id) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const internalId = String(existing.id);

    // Find and delete physical documents from storage
    const docs = db.prepare('SELECT * FROM documents WHERE profile_id = ?').all(internalId) as Record<string, unknown>[];
    for (const doc of docs) {
      await deleteSecureDocument(String(doc.file_name));
    }

    // Delete document records
    db.prepare('DELETE FROM documents WHERE profile_id = ?').run(internalId);

    // Delete profile record
    db.prepare('DELETE FROM profiles WHERE id = ?').run(internalId);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'PROFILE_DELETED',
      details: `Permanently deleted profile ${existing.profile_id} (${existing.full_name || 'No Name'}) and ${docs.length} associated documents`,
      profileId: String(existing.profile_id),
      profileName: String(existing.full_name || existing.profile_id),
      adminEmail: session.email,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: `Profile ${existing.profile_id} permanently deleted.`,
    });
  } catch (err: unknown) {
    console.error('Delete profile error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to delete profile' }, { status: 500 });
  }
}
