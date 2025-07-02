import { type ClassValue, clsx } from 'clsx';
import { User } from '@repo/shared-types';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Unknown User';

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.lastName) {
    return user.lastName;
  }

  if (user.email) {
    return user.email?.split('@')?.[0] || 'Unknown User';
  }

  return 'Unknown User';
}

export function getAvatarUrl(
  avatarUrl?: string | null,
  user?: User | { firstName?: string; lastName?: string | null },
): string {
  // If no avatar URL provided, generate a placeholder avatar
  if (!avatarUrl || avatarUrl === '') {
    let name = 'U';
    if (user?.firstName || user?.lastName) {
      name = `${user.firstName || ''}${user.lastName || ''}`.trim();
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=128&bold=true`;
  }

  // Handle full URLs
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  // Handle absolute paths
  if (avatarUrl.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${avatarUrl}`;
  }

  // Handle relative paths
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${avatarUrl}`;
}

export function getInitials(
  input: string | { firstName?: string; lastName?: string | null; user?: User } | User | {},
): string {
  // Helper function to extract initials from first and last name
  const extractInitials = (firstName?: string, lastName?: string | null): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (typeof input === 'string') {
    const trimmed = input?.trim();
    if (!trimmed) return 'U';

    const parts = trimmed.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
  }

  if (typeof input === 'object' && input !== null) {
    if ('user' in input) {
      const user = input.user;
      return extractInitials(user?.firstName, user?.lastName);
    }

    if ('firstName' in input) {
      const userInput = input as { firstName?: string; lastName?: string | null };
      return extractInitials(userInput.firstName, userInput.lastName);
    }
  }

  return 'U';
}
