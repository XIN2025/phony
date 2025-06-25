import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { envConfig } from '@/config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserDisplayName(
  user:
    | {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
): string;

export function getUserDisplayName(
  session:
    | {
        user?: {
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
        } | null;
      }
    | null
    | undefined,
): string;

export function getUserDisplayName(input: unknown): string {
  if (!input) return 'User';

  // Check if it's a session object with user
  if (typeof input === 'object' && input !== null && 'user' in input) {
    const user = (
      input as { user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null }
    ).user;
    if (user?.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.lastName) {
      return user.lastName;
    }
    return user?.email?.split('@')[0] || 'User';
  }

  // Check if it's a user object directly
  if (typeof input === 'object' && input !== null && 'firstName' in input) {
    const user = input as { firstName?: string | null; lastName?: string | null; email?: string | null };
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    return user.email?.split('@')[0] || 'User';
  }

  return 'User';
}

export function getInitials(
  input: string | { firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } },
): string {
  if (typeof input === 'string') {
    const parts = input.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return input.charAt(0).toUpperCase();
  }

  if (typeof input === 'object' && input !== null && 'user' in input) {
    const user = input.user;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    }
  }

  if (typeof input === 'object' && input !== null && 'firstName' in input) {
    const userInput = input as { firstName?: string; lastName?: string };
    if (userInput.firstName && userInput.lastName) {
      return `${userInput.firstName.charAt(0)}${userInput.lastName.charAt(0)}`.toUpperCase();
    }
    if (userInput.firstName) {
      return userInput.firstName.charAt(0).toUpperCase();
    }
    if (userInput.lastName) {
      return userInput.lastName.charAt(0).toUpperCase();
    }
  }

  return 'U';
}

export function getFullAvatarUrl(avatarUrl?: string | null): string {
  if (!avatarUrl) {
    return '';
  }

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  if (avatarUrl.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${avatarUrl}`;
  }

  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${avatarUrl}`;
}
