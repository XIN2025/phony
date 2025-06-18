import { UserRole } from '@repo/db';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  sub: string;
}
