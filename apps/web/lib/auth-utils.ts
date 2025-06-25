import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  profession: string | null;
  clientStatus?: string;
  token: string;
}
export interface AuthSession {
  user: AuthUser;
  error?: string;
}
/**
 * Get the current session (works on both client and server)
 * This is used by ApiClient for server-side requests
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const isServer = typeof window === 'undefined';
  const session = isServer ? await getServerSession(authOptions) : await getSession();
  if (!session?.user) {
    return null;
  }
  return session as AuthSession;
}
/**
 * Clear all authentication data and cookies
 * Used during logout and session cleanup
 */
export async function clearAllAuthData(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side - can't clear cookies here
    return;
  }
  // Clear localStorage
  localStorage.clear();
  // Clear sessionStorage
  sessionStorage.clear();
  // Clear all cookies related to authentication
  const cookiesToClear = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
  ];
  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
  });
}
