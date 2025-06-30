import { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ApiClient } from '@/lib/api-client';
import { envConfig } from '@/config';
import { LoginResponse } from '@repo/shared-types/types';
import { createAuthError, validateAuthFields } from '@/lib/auth-utils';
import { UserRole, ClientStatus } from '@repo/db';

const credentialsAuthProvider = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    otp: { label: 'OTP', type: 'text' },
    role: { label: 'Role', type: 'text' },
    token: { label: 'Token', type: 'text' },
  },
  async authorize(credentials) {
    try {
      validateAuthFields(credentials || {});

      if (credentials?.token) {
        const res = await ApiClient.get<LoginResponse['user']>('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${credentials.token}`,
          },
        });

        const user: User = {
          id: res.id,
          email: res.email,
          token: credentials.token,
          role: res.role,
          firstName: res.firstName ?? '',
          lastName: res.lastName ?? '',
          avatarUrl: res.avatarUrl ?? '',
          profession: res.profession ?? null,
          clientStatus: res.clientStatus,
          practitionerId: res.practitionerId ?? null,
          isEmailVerified: res.isEmailVerified ?? false,
          idProofUrl: res.idProofUrl ?? null,
        };
        return user;
      }

      if (!credentials?.otp) {
        throw new Error('OTP required');
      }

      const res = await ApiClient.post<LoginResponse>('/api/auth/otp/verify', {
        email: credentials.email,
        otp: credentials.otp,
        role: credentials.role as 'CLIENT' | 'PRACTITIONER',
      });

      const user: User = {
        id: res.user.id,
        email: res.user.email,
        token: res.token,
        role: res.user.role,
        firstName: res.user.firstName ?? '',
        lastName: res.user.lastName ?? '',
        avatarUrl: res.user.avatarUrl ?? '',
        profession: res.user.profession ?? null,
        clientStatus: res.user.clientStatus,
        practitionerId: res.user.practitionerId ?? null,
        isEmailVerified: res.user.isEmailVerified ?? false,
        idProofUrl: res.user.idProofUrl ?? null,
      };
      return user;
    } catch (error) {
      const authError = createAuthError(error);
      throw new Error(authError.message);
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  secret: envConfig.nextAuthSecret,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.profession = user.profession;
        token.avatarUrl = user.avatarUrl || '';
        token.token = user.token;
        token.clientStatus = user.clientStatus;
        token.practitionerId = user.practitionerId;
        delete token.error;
        return token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error && (token.error === 'UserNotFound' || token.error === 'InvalidToken')) {
        return {
          expires: new Date(0).toISOString(),
          user: undefined,
          error: token.error,
        };
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.role = token.role as UserRole;
        session.user.profession = token.profession as string;
        session.user.token = token.token as string;
        session.user.clientStatus = token.clientStatus as ClientStatus;
        session.user.practitionerId = token.practitionerId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 10 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  events: {
    async signOut() {
      return;
    },
  },
  pages: {
    signIn: '/client/auth',
    error: '/auth/error',
  },
};
