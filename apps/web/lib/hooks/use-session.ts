import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useCachedSession() {
  const { data: session, status } = useSession();
  const cachedSession = useMemo(() => session, [session]);
  return {
    data: cachedSession,
    status,
  };
}

export function useAuthStatus() {
  const { status } = useSession();
  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isUnauthenticated: status === 'unauthenticated',
    status,
  };
}
