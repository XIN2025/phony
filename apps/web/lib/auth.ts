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
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[NextAuth:${requestId}] 🔐 Starting authorization process`);
    console.log(`[NextAuth:${requestId}] 📝 Credentials received:`, {
      hasEmail: !!credentials?.email,
      hasOtp: !!credentials?.otp,
      hasRole: !!credentials?.role,
      email: credentials?.email,
      role: credentials?.role,
      otpLength: credentials?.otp?.length,
    });

    try {
      if (!credentials?.email || !credentials?.otp) {
        console.log(
          `[NextAuth:${requestId}] ❌ Missing credentials: email=${!!credentials?.email}, otp=${!!credentials?.otp}`,
        );
        throw new Error('Email and OTP required');
      }

      console.log(`[NextAuth:${requestId}] 📡 Calling AuthService.verifyOtp...`);
      const res = await AuthService.verifyOtp({
        email: credentials.email,
        otp: credentials.otp,
        role: credentials.role as 'CLIENT' | 'PRACTITIONER',
      });

      console.log(`[NextAuth:${requestId}] ✅ AuthService.verifyOtp successful:`, {
        hasUser: !!res.user,
        hasToken: !!res.token,
        userId: res.user?.id,
        userEmail: res.user?.email,
        userRole: res.user?.role,
      });

      const user: User = {
        id: res.user.id,
        email: res.user.email,
        token: res.token,
        role: res.user.role,
        name: res.user.name ?? 'Unknown',
        avatarUrl: res.user.avatarUrl ?? '',
      };

      console.log(`[NextAuth:${requestId}] 🎉 Authorization successful, returning user:`, {
        id: user.id,
        email: user.email,
        role: user.role,
        hasToken: !!user.token,
      });

      return user;
    } catch (error) {
      console.error(`[NextAuth:${requestId}] 💥 Authorization failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error((error as Error)?.message || 'Invalid credentials');
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production',
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const callbackId = Math.random().toString(36).substring(7);
      console.log(`[NextAuth:${callbackId}] 🔄 JWT callback triggered:`, {
        trigger,
        hasUser: !!user,
        hasToken: !!token,
        hasSession: !!session,
      });

      if (trigger === 'update' && session?.user) {
        console.log(`[NextAuth:${callbackId}] 🔄 JWT update trigger:`, {
          sessionUser: session.user,
        });
        return { ...token, ...session.user };
      }

      if (user) {
        console.log(`[NextAuth:${callbackId}] 👤 JWT user data:`, {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          hasToken: !!user.token,
        });
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.profession = user.profession;
        token.avatarUrl = user.avatarUrl || '';
        token.token = user.token;
      }

      console.log(`[NextAuth:${callbackId}] ✅ JWT callback completed`);
      return token;
    },
    async session({ session, token }) {
      const callbackId = Math.random().toString(36).substring(7);
      console.log(`[NextAuth:${callbackId}] 🔄 Session callback triggered:`, {
        hasSession: !!session,
        hasToken: !!token,
        tokenData: {
          id: token.id,
          email: token.email,
          role: token.role,
          hasToken: !!token.token,
        },
      });

      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.role = token.role as string;
        session.user.profession = token.profession as string;
        session.user.token = token.token as string;

        console.log(`[NextAuth:${callbackId}] ✅ Session callback completed:`, {
          sessionUser: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            hasToken: !!session.user.token,
          },
        });
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
};
