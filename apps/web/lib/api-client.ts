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

      // Use the internal URL only if we are inside a Docker container (for SSR)
      const useInternalUrl = isServer && process.env.DOCKER_ENV === 'true';
      const baseURL = useInternalUrl ? envConfig.internalApiUrl : envConfig.apiUrl;

      console.log(
        `[ApiClient] Requesting. isServer: ${isServer}, useInternalUrl: ${useInternalUrl}, baseURL: ${baseURL}, url: ${config.url}`,
      );

      const client = axios.create({
        baseURL: baseURL,
        timeout: timeout,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(session?.user?.token && !isPublicEndpoint ? { Authorization: `Bearer ${session.user.token}` } : {}),
          ...(session?.user?.id ? { 'x-user-id': session.user.id } : {}),
          ...config.headers,
        },
      });

      console.log('[ApiClient] Axios client created with headers:', client.defaults.headers);

      const response: AxiosResponse<T> = await client.request(config);
      return response.data;
    } catch (err) {
      console.error('[ApiClient] Error during request:', err);
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
