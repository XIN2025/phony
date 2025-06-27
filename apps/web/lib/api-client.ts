import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession } from 'next-auth/react';
import { createAuthError } from '@/lib/auth-utils';

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const isServer = typeof window === 'undefined';
      const session = isServer ? await getServerSession(authOptions) : await getSession();
      const isFormData = config.data instanceof FormData;

      const publicEndpoints = [
        '/api/auth/otp',
        '/api/auth/otp/verify',
        '/api/auth/practitioner/signup',
        '/api/auth/client/signup',
        '/api/invitations/token/',
      ];

      const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

      const isOtpRequest = config.url?.includes('/auth/otp');
      const timeout = isOtpRequest ? 30000 : 10000;

      const client = axios.create({
        baseURL: envConfig.apiUrl,
        timeout: timeout,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(session?.user?.token && !isPublicEndpoint ? { Authorization: `Bearer ${session.user.token}` } : {}),
          ...config.headers,
        },
      });

      const response: AxiosResponse<T> = await client.request(config);
      return response.data;
    } catch (err) {
      throw createAuthError(err);
    }
  }

  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  static async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  static async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  static async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}
