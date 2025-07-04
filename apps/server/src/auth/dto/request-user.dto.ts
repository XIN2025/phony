import { UserRole, ClientStatus } from '@repo/db';

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: (typeof UserRole)[keyof typeof UserRole];
  clientStatus?: (typeof ClientStatus)[keyof typeof ClientStatus];
  practitionerId?: string | null;
}
