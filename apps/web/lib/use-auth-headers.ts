import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useAuthHeaders() {
  const { data: session } = useSession();

  const headers = useMemo(() => {
    const authHeaders: Record<string, string> = {};

    if (session?.user?.token) {
      authHeaders.Authorization = `Bearer ${session.user.token}`;
    }

    return authHeaders;
  }, [session?.user?.token]);

  return headers;
}
