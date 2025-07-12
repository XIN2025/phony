export const API_RESPONSES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export const TIMER_DURATIONS = {
  OTP_RESEND: 60,
  SESSION_TIMEOUT: 30 * 60,
  FILE_UPLOAD_TIMEOUT: 300,
} as const;

export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_EMAIL_LENGTH: 255,
  MAX_NAME_LENGTH: 100,
  OTP_LENGTH: 6,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
} as const;

export const DB_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_ORDER: 'desc',
} as const;

export const FILE_UPLOAD = {
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
  ],
  MAX_SIZE: VALIDATION_RULES.MAX_FILE_SIZE,
  UPLOAD_PATH: './uploads',
} as const;

export type ApiResponse = (typeof API_RESPONSES)[keyof typeof API_RESPONSES];

export const AVATAR_CONSTANTS = {
  DICEBEAR_BASE_URL: 'https://api.dicebear.com/7.x/adventurer/svg',
  UI_AVATARS_BASE_URL: 'https://ui-avatars.com/api',
} as const;

export const DATE_CONSTANTS = {
  DATE_FORMAT: 'MMM dd, yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'MMM dd, yyyy HH:mm',
  ISO_FORMAT: 'yyyy-MM-dd',
} as const;
