import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserDisplayName(user: any): string {
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
    return user.email.split('@')[0];
  }

  return 'Unknown User';
}

export function getUserInitials(user: any): string {
  if (!user) return 'U';

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }

  if (lastName) {
    return lastName.charAt(0).toUpperCase();
  }

  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return 'U';
}

export function getAvatarUrl(avatarUrl?: string | null, user?: { firstName?: string; lastName?: string }): string {
  if (!avatarUrl) {
    if (user?.firstName && user?.lastName) {
      const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128`;
    }
    return `https://ui-avatars.com/api/?name=U&background=random&size=128`;
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
