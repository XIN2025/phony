import * as path from 'path';

// File upload constants
export const UPLOAD_CONSTANTS = {
  UPLOAD_DIR: 'uploads',
  UPLOAD_PATH: path.join(process.cwd(), 'uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Avatar service constants
export const AVATAR_CONSTANTS = {
  DICEBEAR_BASE_URL: 'https://api.dicebear.com/7.x/adventurer/svg',
} as const;

// Date formatting constants
export const DATE_FORMAT_OPTIONS = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const,
} as const;

// Invitation constants
export const INVITATION_EXPIRY_DAYS = 7;
export const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
