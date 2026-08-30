import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db, generateNextProfileId, mapRowToProfile, getDocumentsForProfile } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { calculateProfileCompleteness } from '@/lib/formatters';
import { ProfileStatus } from '@/types';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const state = searchParams.get('state')?.trim() || '';
  const city = searchParams.get('city')?.trim() || '';
  const bank = searchParams.get('bank')?.trim() || '';
  const sort = searchParams.get('sort') || 'newest';

  let queryStr = 'SELECT * FROM profiles WHERE 1=1';
  const params: unknown[] = [];

  if (q) {
    queryStr += ` AND (
      full_name LIKE ? OR
      profile_id LIKE ?
    )`;
    const wildcard = `%${q}%`;
    params.push(wildcard, wildcard);
  }

  if (status && status !== 'all') {
    queryStr += ' AND status = ?';
    params.push(status);
  }

  if (state && state !== 'all') {
    queryStr += ' AND state = ?';
    params.push(state);
  }

  if (city && city !== 'all') {
    queryStr += ' AND city = ?';
    params.push(city);
  }

  if (bank && bank !== 'all') {
    queryStr += ' AND bank_name = ?';
    params.push(bank);
  }

  if (sort === 'oldest') {
    queryStr += ' ORDER BY created_at ASC';
  } else if (sort === 'name_asc') {
    queryStr += ' ORDER BY full_name ASC';
  } else if (sort === 'profile_id_asc') {
    queryStr += ' ORDER BY CAST(SUBSTR(profile_id, 4) AS INTEGER) ASC';
  } else if (sort === 'profile_id_desc') {
    queryStr += ' ORDER BY CAST(SUBSTR(profile_id, 4) AS INTEGER) DESC';
  } else {
    // default newest
    queryStr += ' ORDER BY updated_at DESC';
  }

  const rows = db.prepare(queryStr).all(...params) as Record<string, unknown>[];
  const profiles = rows.map(r => {
    const docs = getDocumentsForProfile(String(r.id));
    return mapRowToProfile(r, docs);
  });

  // Extract filter options for convenient UI dropdowns
  const distinctStatuses = db.prepare("SELECT DISTINCT status FROM profiles WHERE status IS NOT NULL AND status != ''").all().map((r: unknown) => (r as { status: string }).status);
  const distinctStates = db.prepare("SELECT DISTINCT state FROM profiles WHERE state IS NOT NULL AND state != ''").all().map((r: unknown) => (r as { state: string }).state);
  const distinctCities = db.prepare("SELECT DISTINCT city FROM profiles WHERE city IS NOT NULL AND city != ''").all().map((r: unknown) => (r as { city: string }).city);
  const distinctBanks = db.prepare("SELECT DISTINCT bank_name FROM profiles WHERE bank_name IS NOT NULL AND bank_name != ''").all().map((r: unknown) => (r as { bank_name: string }).bank_name);

  return NextResponse.json({
    profiles,
    total: profiles.length,
    filterOptions: {
      statuses: distinctStatuses,
      states: distinctStates,
      cities: distinctCities,
      banks: distinctBanks,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = uuidv4();
    const autoProfileId = generateNextProfileId();
    const now = new Date().toISOString();

    // Determine status: if explicitly provided use it, otherwise compute suggested status
    let profileStatus: ProfileStatus = body.status;
    if (!profileStatus) {
      const { suggestedStatus } = calculateProfileCompleteness(body);
      profileStatus = suggestedStatus;
    }

    const insertStmt = db.prepare(`
      INSERT INTO profiles (
        id, profile_id, status, full_name, dob, gender, student_employee_id, referral_id,
        email, mobile, country, state, city, full_address, bank_upi_id, payee_name,
        bank_name, account_number, ifsc_code, account_type, dmat_agency,
        dmat_account_number, pan_number, kyc_completion_date, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      id,
      autoProfileId,
      profileStatus,
      body.fullName?.trim() || null,
      body.dob?.trim() || null,
      body.gender?.trim() || null,
      body.studentEmployeeId?.trim() || null,
      body.referralId?.trim() || null,
      body.email?.trim() || null,
      body.mobile?.trim() || null,
      body.country?.trim() || 'India',
      body.state?.trim() || null,
      body.city?.trim() || null,
      body.fullAddress?.trim() || null,
      body.bankUpiId?.trim() || null,
      body.payeeName?.trim() || null,
      body.bankName?.trim() || null,
      body.accountNumber?.trim() || null,
      body.ifscCode?.trim() || null,
      body.accountType?.trim() || null,
      body.dmatAgency?.trim() || null,
      body.dmatAccountNumber?.trim() || null,
      body.panNumber?.trim()?.toUpperCase() || null,
      body.kycCompletionDate?.trim() || null,
      now,
      now
    );

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'PROFILE_CREATED',
      details: `Created new intelligence profile ${autoProfileId}${body.fullName ? ` (${body.fullName})` : ' [No Name]'} with status '${profileStatus}'`,
      profileId: autoProfileId,
      profileName: body.fullName || autoProfileId,
      adminEmail: session.email,
      ipAddress: ip,
    });

    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as Record<string, unknown>;
    const createdProfile = mapRowToProfile(row, []);

    return NextResponse.json({
      success: true,
      profile: createdProfile,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create profile error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to create profile' }, { status: 500 });
  }
}
