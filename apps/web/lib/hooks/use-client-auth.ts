import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ExtendedUser {
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

interface ExtendedSession {
  user: ExtendedUser;
  error?: string;
}

export const useClientAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session?.user) {
      router.push('/client/auth');
      return;
    }

    const extendedSession = session as unknown as ExtendedSession;

    if (extendedSession.user.role !== 'CLIENT') {
      router.push('/practitioner');
      return;
    }

    if (!extendedSession.user.firstName || !extendedSession.user.lastName) {
      router.push('/client/profile-setup');
      return;
    }

    if (extendedSession.user.clientStatus === 'NEEDS_INTAKE') {
      router.push('/client/intake');
      return;
    }
  }, [status, session, router]);

  const extendedSession = session as unknown as ExtendedSession | null;

  return {
    session: extendedSession,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!extendedSession?.user && extendedSession.user.role === 'CLIENT',
    user: extendedSession?.user,
  };
};
