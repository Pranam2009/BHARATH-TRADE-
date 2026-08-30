import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { getSecureDocumentPath, deleteSecureDocument } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const filePath = getSecureDocumentPath(String(doc.file_name));
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Physical document file missing from vault' }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.promises.readFile(filePath);

    // Optional audit on document access
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'DOCUMENT_VIEWED',
      details: `Viewed ${String(doc.doc_type).toUpperCase()} (${doc.original_name})`,
      profileId: String(doc.profile_id),
      adminEmail: session.email,
      ipAddress: ip,
    });

    const headers = new Headers();
    headers.set('Content-Type', String(doc.mime_type));
    headers.set('Content-Length', String(fileBuffer.length));
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Content-Disposition', `inline; filename="${doc.original_name}"`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Stream document error:', err);
    return NextResponse.json({ error: 'Failed to read document' }, { status: 500 });
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
    const doc = db.prepare(`
      SELECT d.*, p.profile_id as owner_profile_id, p.full_name as owner_name 
      FROM documents d 
      LEFT JOIN profiles p ON d.profile_id = p.id 
      WHERE d.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete physical file
    await deleteSecureDocument(String(doc.file_name));

    // Delete from DB
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    // Update profile timestamp
    const now = new Date().toISOString();
    db.prepare('UPDATE profiles SET updated_at = ? WHERE id = ?').run(now, doc.profile_id);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    createAuditLog({
      action: 'DOCUMENT_DELETED',
      details: `Deleted document ${doc.doc_type} (${doc.original_name}) from profile ${doc.owner_profile_id}`,
      profileId: String(doc.owner_profile_id || ''),
      profileName: String(doc.owner_name || ''),
      adminEmail: session.email,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Document permanently deleted from vault.',
    });
  } catch (err: unknown) {
    console.error('Delete document error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to delete document' }, { status: 500 });
  }
}
