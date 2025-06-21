import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
    profession?: string | null;
    token: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
      role: string;
      profession?: string | null;
      token: string;
    };
  }

  interface JWT {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
    profession?: string | null;
    token: string;
  }
}
