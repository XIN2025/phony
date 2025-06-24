import { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthService } from '@/services';
import { envConfig } from '@/config';
const credentialsAuthProvider = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    otp: { label: 'OTP', type: 'text' },
    role: { label: 'Role', type: 'text' },
  },
  async authorize(credentials) {
    try {
      if (!credentials?.email) {
        throw new Error('Email required');
      }

      // Handle regular OTP verification
      if (!credentials?.otp) {
        throw new Error('OTP required');
      }

      const res = await AuthService.verifyOtp({
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
      };
      return user;
    } catch (error) {
      console.error('Authorization failed:', error);
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error('Invalid OTP. Please check your OTP and try again.');
      }
      if (errorMessage.includes('Invalid OTP')) {
        throw new Error('Invalid OTP. Please check your OTP and try again.');
      }
      throw new Error(errorMessage || 'Invalid credentials');
    }
  },
});
export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  secret: envConfig.nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        // User just signed in
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.profession = user.profession;
        token.avatarUrl = user.avatarUrl || '';
        token.token = user.token;
        token.clientStatus = user.clientStatus;
        delete token.error;
        return token;
      }
      // For existing sessions, just return the token as-is
      // Backend JWT strategy will handle validation when making API calls
      return token;
    },
    async session({ session, token }) {
      // If token has a critical error, return an error session
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
        session.user.role = token.role as string;
        session.user.profession = token.profession as string;
        session.user.token = token.token as string;
        session.user.clientStatus = token.clientStatus as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
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
    async signOut({ token }) {
      // User signed out successfully
    },
  },
  pages: {
    signIn: '/client/auth',
    error: '/auth/error',
  },
};
