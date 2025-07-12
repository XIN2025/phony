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
  input: string | { firstName?: string; lastName?: string | null; user?: User } | User | object,
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

// Returns true if two dates are the same day (ignoring time)
export function isSameDay(date1: Date | string | null | undefined, date2: Date | string | null | undefined): boolean {
  // Handle null/undefined dates
  if (!date1 || !date2) return false;

  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  // Check if dates are valid
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

// Returns a string representing engagement level based on completion ratio
export function getEngagementForDay(tasks: any[]): string {
  if (!tasks || tasks.length === 0) return 'Nil';
  const completed = tasks.filter((t) => t.completions && t.completions.length > 0).length;
  const ratio = completed / tasks.length;
  if (ratio === 1) return 'High';
  if (ratio >= 0.5) return 'Medium';
  if (ratio > 0) return 'Low';
  return 'Nil';
}

// Maps individual task rating to emoji
export function getRatingEmoji(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return '😊'; // Default for completed tasks without rating

  if (rating >= 4) return '😊'; // Happy
  if (rating >= 2.5) return '😐'; // Neutral
  return '🙁'; // Sad
}
