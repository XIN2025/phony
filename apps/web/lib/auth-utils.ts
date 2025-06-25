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

  const cookies = document.cookie.split(';');
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

/**
 * Centralized error mapping utilities for authentication
 */

export interface AuthError {
  error: string;
  message: string;
}

export function validateAuthFields(credentials: Record<string, any>): void {
  if (!credentials.email) {
    throw new Error('Email is required');
  }
  if (!credentials.role) {
    throw new Error('Role is required');
  }
}

interface ErrorMapping {
  pattern: string | RegExp;
  message: string;
  priority: number;
}

const errorMappings: ErrorMapping[] = [
  {
    pattern: /email.*not.*found/i,
    message: 'Email not found. Please check your email address.',
    priority: 10,
  },
  {
    pattern: /invalid.*otp/i,
    message: 'Invalid OTP. Please check your code and try again.',
    priority: 10,
  },
  {
    pattern: /otp.*expired/i,
    message: 'OTP has expired. Please request a new code.',
    priority: 10,
  },
  {
    pattern: /too.*many.*requests/i,
    message: 'Too many requests. Please wait before trying again.',
    priority: 10,
  },
  {
    pattern: /network.*error/i,
    message: 'Network error. Please check your connection.',
    priority: 9,
  },
  {
    pattern: /timeout/i,
    message: 'Request timed out. Please try again.',
    priority: 9,
  },
  {
    pattern: /401/i,
    message: 'Authentication failed. Please log in again.',
    priority: 8,
  },
  {
    pattern: /403/i,
    message: 'Access denied. You do not have permission.',
    priority: 8,
  },
  {
    pattern: /404/i,
    message: 'Resource not found. Please check the URL.',
    priority: 8,
  },
  {
    pattern: /500/i,
    message: 'Server error. Please try again later.',
    priority: 8,
  },
  {
    pattern: /failed.*to.*fetch/i,
    message: 'Connection failed. Please check your internet.',
    priority: 7,
  },
  {
    pattern: /axios.*error/i,
    message: 'Request failed. Please try again.',
    priority: 6,
  },
];

export function createAuthError(error: unknown): AuthError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();

  const sortedMappings = errorMappings.sort((a, b) => b.priority - a.priority);

  for (const mapping of sortedMappings) {
    if (typeof mapping.pattern === 'string') {
      if (errorString.includes(mapping.pattern.toLowerCase())) {
        return {
          error: 'AuthError',
          message: mapping.message,
        };
      }
    } else {
      if (mapping.pattern.test(errorMessage)) {
        return {
          error: 'AuthError',
          message: mapping.message,
        };
      }
    }
  }

  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return {
        error: 'Unauthorized',
        message: 'Authentication failed. Please log in again.',
      };
    }
    if (error.response?.status === 403) {
      return {
        error: 'Forbidden',
        message: 'Access denied. You do not have permission.',
      };
    }
    if (error.response?.status === 404) {
      return {
        error: 'NotFound',
        message: 'Resource not found. Please check the URL.',
      };
    }
    if (error.response?.status && error.response.status >= 500) {
      return {
        error: 'ServerError',
        message: 'Server error. Please try again later.',
      };
    }
  }

  return {
    error: 'UnknownError',
    message: 'An unexpected error occurred. Please try again.',
  };
}
