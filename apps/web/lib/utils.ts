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
  if (!avatarUrl || avatarUrl === '') {
    let name = 'U';
    if (user?.firstName || user?.lastName) {
      name = `${user.firstName || ''}${user.lastName || ''}`.trim();
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8C7FC8&color=ffffff&size=128&bold=true`;
  }

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  if (avatarUrl.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${avatarUrl}`;
  }

  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${avatarUrl}`;
}

export function getInitials(
  input: string | { firstName?: string; lastName?: string | null; user?: User } | User | object,
): string {
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

export function isSameDay(date1: Date | string | null | undefined, date2: Date | string | null | undefined): boolean {
  if (!date1 || !date2) return false;

  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function getEngagementForDay(tasks: Array<{ completions?: Array<unknown> }>, date?: Date): string {
  if (!tasks || tasks.length === 0) return 'Nil';

  let completed: number;

  if (date) {
    // Check completion for specific date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    completed = tasks.filter((t) => {
      return (
        t.completions &&
        t.completions.some((completion) => {
          const comp = completion as { completionDate?: string; completedAt?: string };
          const completionDate = comp.completionDate || comp.completedAt;
          if (!completionDate) return false;
          const date = new Date(completionDate);
          return date >= dateStart && date <= dateEnd;
        })
      );
    }).length;
  } else {
    // Legacy behavior - check if any completion exists
    completed = tasks.filter((t) => t.completions && t.completions.length > 0).length;
  }

  const ratio = completed / tasks.length;
  if (ratio === 1) return 'High';
  if (ratio >= 0.5) return 'Medium';
  if (ratio > 0) return 'Low';
  return 'Nil';
}

export function getRatingEmoji(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return '😊';

  if (rating >= 4) return '😊';
  if (rating >= 2.5) return '😐';
  return '🙁';
}

export function getFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  if (fileUrl.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${fileUrl}`;
  }
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${fileUrl}`;
}
