import { HttpClient } from '@/lib/http-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  profession?: string;
  clientStatus?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  profession?: string;
}

export class UserService {
  static async getCurrentUser(headers: Record<string, string>): Promise<User> {
    return HttpClient.get<User>('/api/auth/me', { headers });
  }

  static async updateProfile(data: ProfileUpdateData, headers: Record<string, string>, file?: File): Promise<User> {
    const formData = new FormData();

    if (data.firstName) formData.append('firstName', data.firstName);
    if (data.lastName) formData.append('lastName', data.lastName);
    if (data.profession) formData.append('profession', data.profession);
    if (file) formData.append('profileImage', file);

    return HttpClient.post<User>('/api/auth/profile', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}
