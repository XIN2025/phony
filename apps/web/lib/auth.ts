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
        throw new Error('Email and OTP required');
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
      };

      return user;
    } catch (error) {
      console.error('Authorization failed:', error);
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

        delete token.error;
        delete token.lastValidation;
      }

      if (token.error) {
        return token;
      }

      if (token.id && token.email && !user) {
        const lastValidation = token.lastValidation as number;
        const now = Date.now();
        const validationCooldown = 5 * 60 * 1000;

        if (!lastValidation || now - lastValidation > validationCooldown) {
          try {
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/validate-session`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: token.id,
                  email: token.email,
                }),
              },
            );

            if (!response.ok) {
              token.lastValidation = now;
              return token;
            }

            const userExists = await response.json();
            if (!userExists.valid) {
              return { ...token, error: 'UserNotFound', lastValidation: now };
            }

            if (userExists.user) {
              token.firstName = userExists.user.firstName;
              token.lastName = userExists.user.lastName;
              token.avatarUrl = userExists.user.avatarUrl;
              token.profession = userExists.user.profession;
            }

            token.lastValidation = now;
          } catch (error) {
            console.error('Error validating user session:', error);

            token.lastValidation = now;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        return {
          expires: new Date(0).toISOString(),
          user: undefined,
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
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  events: {
    async signOut({ token }) {},
    async session({ session, token }) {},
  },
  pages: {
    signIn: '/client/auth',
    error: '/auth/error',
  },
};
