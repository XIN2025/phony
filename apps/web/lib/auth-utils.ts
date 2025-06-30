import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { AxiosError } from 'axios';

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

export async function getCurrentSession(): Promise<AuthSession | null> {
  const isServer = typeof window === 'undefined';
  const session = isServer ? await getServerSession(authOptions) : await getSession();
  if (!session?.user) {
    return null;
  }
  return session as AuthSession;
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.localStorage !== 'undefined') {
    localStorage.clear();
  }

  if (typeof window.sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }

  const cookies = document.cookie?.split(';') || [];
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    if (!cookie) continue;
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('auth') || name.includes('session') || name.includes('token')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

export async function clearAllAuthData(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.clear();
  sessionStorage.clear();

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

export interface AuthError {
  error: string;
  message: string;
}

export function validateAuthFields(credentials: Record<string, unknown>): void {
  if (!credentials.email) {
    throw new Error('Email is required');
  }
  if (!credentials.role) {
    throw new Error('Role is required');
  }
}

function cleanErrorMessage(message: string): string {
  if (/^An account with this email already exists/i.test(message)) {
    return 'An account with this email already exists. Please try logging in instead.';
  }
  if (/^Account not found/i.test(message)) {
    return 'No account found with this email. Please check your email or sign up for a new account.';
  }
  if (/^Invalid OTP/i.test(message)) {
    return 'Invalid verification code. Please try again.';
  }
  if (/^OTP has expired/i.test(message)) {
    return 'Verification code has expired. Please request a new code.';
  }
  return message;
}

interface ErrorObject {
  message?: string;
  error?: string;
  data?: {
    message?: string;
  };
}

export function createAuthError(error: unknown, userRole?: 'CLIENT' | 'PRACTITIONER'): AuthError {
  let errorMessage = '';

  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Request failed';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    const errorObj = error as ErrorObject;
    if (errorObj.message) {
      errorMessage = errorObj.message;
    } else if (errorObj.error) {
      errorMessage = errorObj.error;
    } else if (errorObj.data?.message) {
      errorMessage = errorObj.data.message;
    } else {
      errorMessage = JSON.stringify(error);
    }
  } else {
    errorMessage = String(error);
  }

  // Handle role-specific error messages
  if (userRole && errorMessage.includes('Invalid role')) {
    const oppositeRole = userRole === 'CLIENT' ? 'practitioner' : 'client';
    errorMessage = `This email is registered as a ${oppositeRole}. Please use the ${oppositeRole} login page.`;
  }

  const cleanedMessage = cleanErrorMessage(errorMessage);

  return {
    error: 'AuthError',
    message: cleanedMessage || 'An unexpected error occurred. Please try again.',
  };
}

// Legacy function for backward compatibility - now uses createAuthError internally
export function handleLoginError(error: string | Error | unknown, userRole: 'CLIENT' | 'PRACTITIONER'): string {
  const authError = createAuthError(error, userRole);
  return authError.message;
}
