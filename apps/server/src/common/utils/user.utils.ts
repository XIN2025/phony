import { UserRole, User as PrismaUser } from '@repo/db';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/common/config';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { UPLOAD_CONSTANTS } from './constants';

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizeUserData(user: PrismaUser): {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profession?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  practitionerId?: string | null;
  clientStatus?: 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED';
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    ...user,
    clientStatus: user.clientStatus ?? undefined,
  };
}

export function createUserResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profession?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  practitionerId?: string | null;
  clientStatus?: 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    profession: user.profession ?? null,
    avatarUrl: user.avatarUrl ?? null,
    clientStatus: user.clientStatus ?? undefined,
    isEmailVerified: user.isEmailVerified,
    practitionerId: user.practitionerId ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createJwtPayload(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    practitionerId?: string | null;
    clientStatus?: 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED';
  },
  additionalData?: Record<string, unknown>
) {
  return {
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    practitionerId: user.practitionerId ?? undefined,
    clientStatus: user.clientStatus ?? undefined,
    ...additionalData,
  };
}

export function generateToken(
  jwtService: JwtService,
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    practitionerId?: string | null;
    clientStatus?: 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED';
  },
  additionalData?: Record<string, unknown>,
  expiresIn?: string
): Promise<string> {
  const payload = createJwtPayload(user, additionalData);
  return jwtService.signAsync(payload, {
    secret: config.jwt.secret,
    expiresIn: expiresIn || config.jwt.expiresIn,
  });
}

export function updateClientStatus(
  currentStatus: 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED',
  submissionExists: boolean
): 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED' {
  if (submissionExists) {
    return 'INTAKE_COMPLETED';
  }

  switch (currentStatus) {
    case 'ACTIVE':
      return 'NEEDS_INTAKE';
    case 'NEEDS_INTAKE':
      return 'NEEDS_INTAKE';
    case 'INTAKE_COMPLETED':
      return 'INTAKE_COMPLETED';
    default:
      return 'ACTIVE';
  }
}

export function getPractitionerName(user: { firstName: string; lastName: string; profession?: string | null }): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return user.profession ? `${fullName} (${user.profession})` : fullName;
}

export function getIntakeFormTitle(form: {
  title: string;
  practitioner?: {
    firstName: string;
    lastName: string;
    profession?: string | null;
  } | null;
}): string {
  if (form.practitioner) {
    const practitionerName = getPractitionerName(form.practitioner);
    return `${form.title} - ${practitionerName}`;
  }
  return form.title;
}

export function getAvatarUrl(user: { avatarUrl?: string | null; firstName: string; lastName: string }): string {
  if (user.avatarUrl) {
    return user.avatarUrl;
  }
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function decodeInvitationToken(token: string): string {
  try {
    return Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    return token;
  }
}

export function throwAuthError(message: string, type: 'unauthorized' | 'badRequest' | 'conflict' | 'notFound'): never {
  const errorMap = {
    unauthorized: new Error(`Unauthorized: ${message}`),
    badRequest: new Error(`Bad Request: ${message}`),
    conflict: new Error(`Conflict: ${message}`),
    notFound: new Error(`Not Found: ${message}`),
  };
  throw errorMap[type];
}

export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(
    (field) => !data[field] || (typeof data[field] === 'string' && !data[field]?.toString().trim())
  );
  if (missingFields.length > 0) {
    throwAuthError(`Missing required fields: ${missingFields.join(', ')}`, 'badRequest');
  }
}

export function determineClientStatus(intakeFormId?: string): 'ACTIVE' | 'NEEDS_INTAKE' | 'INTAKE_COMPLETED' {
  return intakeFormId ? 'NEEDS_INTAKE' : 'ACTIVE';
}

export function validateFileUpload(file: Express.Multer.File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (
    !UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.mimetype as (typeof UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES)[number])
  ) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  if (file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB`,
    };
  }

  return { isValid: true };
}

export async function saveFileToUploads(
  file: Express.Multer.File,
  filename: string,
  uploadsDir: string = 'uploads'
): Promise<string> {
  const uploadPath = join(process.cwd(), uploadsDir);

  try {
    await mkdir(uploadPath, { recursive: true });
  } catch {
    throw new Error('Failed to create uploads directory');
  }

  const filePath = join(uploadPath, filename);

  try {
    await writeFile(filePath, file.buffer);
    return filename;
  } catch {
    throw new Error('Failed to save file');
  }
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

export function trimUserInput(input: string): string {
  return input.trim();
}
