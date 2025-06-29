import 'next-auth';
import { UserRole, ClientStatus } from '@repo/db';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    profession: string | null;
    clientStatus?: ClientStatus;
    practitionerId: string | null;
    token: string;
    isEmailVerified: boolean;
    idProofUrl: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string | null;
      avatarUrl: string | null;
      role: UserRole;
      profession: string | null;
      clientStatus?: ClientStatus;
      practitionerId: string | null;
      token: string;
      isEmailVerified: boolean;
      idProofUrl: string | null;
    };
    error?: string;
  }

  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    profession: string | null;
    clientStatus?: ClientStatus;
    practitionerId: string | null;
    token: string;
    error?: string;
    isEmailVerified: boolean;
    idProofUrl: string | null;
  }
}
