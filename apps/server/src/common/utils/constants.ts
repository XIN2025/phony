import * as path from 'path';

// File upload constants
export const UPLOAD_CONSTANTS = {
  UPLOAD_DIR: 'uploads',
  UPLOAD_PATH: path.join(process.cwd(), 'uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 1,
} as const;

// Avatar service constants
export const AVATAR_CONSTANTS = {
  DICEBEAR_BASE_URL: 'https://api.dicebear.com/7.x/adventurer/svg',
  UI_AVATARS_BASE_URL: 'https://ui-avatars.com/api',
} as const;

// Date formatting constants
export const DATE_CONSTANTS = {
  DATE_FORMAT: 'MMM dd, yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'MMM dd, yyyy HH:mm',
  ISO_FORMAT: 'yyyy-MM-dd',
} as const;
