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
 * Centralized error handling utilities for authentication
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

export function createAuthError(error: unknown): AuthError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    if (responseData?.message) {
      return {
        error: responseData.error || 'ServerError',
        message: responseData.message,
      };
    }

    switch (status) {
      case 400:
        return {
          error: 'BadRequest',
          message: 'Invalid request. Please check your input.',
        };
      case 401:
        return {
          error: 'Unauthorized',
          message: 'Authentication failed. Please log in again.',
        };
      case 403:
        return {
          error: 'Forbidden',
          message: 'Access denied. You do not have permission.',
        };
      case 404:
        return {
          error: 'NotFound',
          message: 'Resource not found.',
        };
      case 429:
        return {
          error: 'RateLimited',
          message: 'Too many requests. Please wait before trying again.',
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          error: 'ServerError',
          message: 'Server error. Please try again later.',
        };
      default:
        return {
          error: 'RequestError',
          message: 'Request failed. Please try again.',
        };
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      error: 'Error',
      message: error.message,
    };
  }

  // Handle unknown errors
  return {
    error: 'UnknownError',
    message: 'An unexpected error occurred. Please try again.',
  };
}
