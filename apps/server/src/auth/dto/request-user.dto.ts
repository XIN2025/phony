import { UserRole, ClientStatus } from '@repo/db';

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
  clientStatus?: ClientStatus;
  practitionerId?: string | null;
}
