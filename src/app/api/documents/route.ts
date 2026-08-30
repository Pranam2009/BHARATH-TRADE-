import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db, mapRowToProfile, getDocumentsForProfile } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { saveSecureDocument, deleteSecureDocument, ALLOWED_MIME_TYPES } from '@/lib/storage';
import { DocumentType } from '@/types';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const docType = searchParams.get('type');

  let query = `
    SELECT d.*, p.profile_id as owner_profile_id, p.full_name as owner_name, p.status as owner_status
    FROM documents d
    JOIN profiles p ON d.profile_id = p.id
  `;
  const params: unknown[] = [];

  if (docType && docType !== 'all') {
    query += ' WHERE d.doc_type = ?';
    params.push(docType);
  }

  query += ' ORDER BY d.created_at DESC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

  const documents = rows.map(r => ({
    id: String(r.id),
    profileId: String(r.profile_id),
    ownerProfileId: String(r.owner_profile_id),
    ownerName: r.owner_name ? String(r.owner_name) : 'Unnamed Profile',
    ownerStatus: String(r.owner_status),
    docType: r.doc_type as DocumentType,
    fileName: String(r.file_name),
    originalName: String(r.original_name),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const profileIdParam = formData.get('profileId') as string;
    const docType = formData.get('docType') as DocumentType;
    const file = formData.get('file') as File | null;

    if (!profileIdParam || !docType || !file) {
      return NextResponse.json({ error: 'profileId, docType, and file are required' }, { status: 400 });
    }

    // Verify profile exists
    const profileRow = db.prepare(`
      SELECT * FROM profiles WHERE id = ? OR profile_id = ? LIMIT 1
    `).get(profileIdParam, profileIdParam) as Record<string, unknown> | undefined;

    if (!profileRow) {
      return NextResponse.json({ error: 'Associated profile not found' }, { status: 404 });
    }

    const internalProfileId = String(profileRow.id);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `File type ${file.type} is not allowed. Accepted: JPG, PNG, WEBP, PDF`,
      }, { status: 400 });
    }

    // Max 15MB file size limit
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 15MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if an existing document of this type exists for this profile -> replace & clean old file
    const existingDoc = db.prepare(`
      SELECT * FROM documents WHERE profile_id = ? AND doc_type = ? LIMIT 1
    `).get(internalProfileId, docType) as Record<string, unknown> | undefined;

    if (existingDoc) {
      await deleteSecureDocument(String(existingDoc.file_name));
      db.prepare('DELETE FROM documents WHERE id = ?').run(existingDoc.id);
    }

    const { fileName, sizeBytes } = await saveSecureDocument(buffer, file.name, file.type);
    const docId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (id, profile_id, doc_type, file_name, original_name, mime_type, size_bytes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      internalProfileId,
      docType,
      fileName,
      file.name,
      file.type,
      sizeBytes,
      now,
      now
    );

    // Update profile updated_at timestamp
    db.prepare('UPDATE profiles SET updated_at = ? WHERE id = ?').run(now, internalProfileId);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${docType.replace('_', ' ').toUpperCase()} (${file.name}, ${(sizeBytes / 1024).toFixed(1)} KB) for profile ${profileRow.profile_id}`,
      profileId: String(profileRow.profile_id),
      profileName: String(profileRow.full_name || profileRow.profile_id),
      adminEmail: session.email,
      ipAddress: ip,
    });

    const docs = getDocumentsForProfile(internalProfileId);
    const updatedProfile = mapRowToProfile(profileRow, docs);

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        profileId: internalProfileId,
        docType,
        fileName,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes,
        createdAt: now,
        updatedAt: now,
      },
      profile: updatedProfile,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('Upload document error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to upload document' }, { status: 500 });
  }
}
