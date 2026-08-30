import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const STORAGE_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'bharatah_storage')
  : path.join(process.cwd(), 'storage', 'documents');

function ensureStorageDir() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create storage directory:', err);
  }
}

ensureStorageDir();

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
  _mimeType: string
): Promise<{ fileName: string; sizeBytes: number }> {
  ensureStorageDir();

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
  ensureStorageDir();
  const safeName = path.basename(fileName);
  const filePath = path.join(STORAGE_DIR, safeName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

export async function deleteSecureDocument(fileName: string): Promise<boolean> {
  try {
    ensureStorageDir();
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
