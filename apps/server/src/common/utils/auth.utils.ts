import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function saveFileToUploads(file: Express.Multer.File, filename: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, file.buffer);

  return `/uploads/${filename}`;
}

export function hashFile(file: Express.Multer.File): Promise<{ isValid: boolean; error?: string; filePath?: string }> {
  return new Promise((resolve) => {
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.mimetype)) {
        return resolve({
          isValid: false,
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        });
      }

      if (file.size > maxSize) {
        return resolve({
          isValid: false,
          error: 'File too large. Maximum size is 5MB.',
        });
      }

      const timestamp = Date.now();
      const randomString = crypto.randomBytes(16).toString('hex');
      const extension = file.originalname.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filePath = `/uploads/${filename}`;

      resolve({
        isValid: true,
        filePath,
      });
    } catch {
      resolve({
        isValid: false,
        error: 'File validation failed',
      });
    }
  });
}
