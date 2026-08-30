import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'documents');

// Ensure secure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

export async function saveSecureDocument(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ fileName: string; sizeBytes: number }> {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const ext = path.extname(originalName) || '.bin';
  const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 8);
  const safeId = uuidv4();
  const fileName = `${safeId}${cleanExt}`;
  const filePath = path.join(STORAGE_DIR, fileName);

  await fs.promises.writeFile(filePath, fileBuffer);

  return {
    fileName,
    sizeBytes: fileBuffer.length,
  };
}

export function getSecureDocumentPath(fileName: string): string | null {
  // Prevent path traversal
  const safeName = path.basename(fileName);
  const filePath = path.join(STORAGE_DIR, safeName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

export async function deleteSecureDocument(fileName: string): Promise<boolean> {
  try {
    const safeName = path.basename(fileName);
    const filePath = path.join(STORAGE_DIR, safeName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.error('Failed to delete secure file:', err);
  }
  return false;
}
