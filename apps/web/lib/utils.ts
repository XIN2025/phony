import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
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
export function getInitials(name: string): string {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]?.[0] ?? ''}${names[names.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
