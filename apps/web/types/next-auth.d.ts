import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    profession?: string | null;
    clientStatus?: string;
    practitionerId?: string | null;
    token: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      role: string;
      profession?: string | null;
      clientStatus?: string;
      practitionerId?: string | null;
      token: string;
    };
    error?: string;
  }

  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    profession?: string | null;
    clientStatus?: string;
    practitionerId?: string | null;
    token: string;
    error?: string;
  }
}
