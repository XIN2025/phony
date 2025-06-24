import { UserRole } from '@repo/db';

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
  clientStatus?: string;
  sub: string;
}
