import { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthService } from '@/services';

const credentialsAuthProvider = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    otp: { label: 'OTP', type: 'text' },
    role: { label: 'Role', type: 'text' },
  },
  async authorize(credentials) {
    try {
      if (!credentials?.email || !credentials?.otp) {
        throw new Error('Email and password required');
      }

      const res = await AuthService.verifyOtp({
        email: credentials.email,
        otp: credentials.otp,
        role: credentials.role as 'CLIENT' | 'PRACTITIONER',
      });
      return {
        id: res.user.id,
        email: res.user.email,
        token: res.token,
        role: res.user.role,
        name: res.user.name ?? 'Unknown',
        avatarUrl: res.user.avatarUrl ?? '',
      } satisfies User;
    } catch (error) {
      throw new Error((error as Error)?.message || 'Invalid credentials');
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.profession = user.profession;
        token.avatarUrl = user.avatarUrl || '';
        token.token = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.role = token.role as string;
        session.user.profession = token.profession as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
};
