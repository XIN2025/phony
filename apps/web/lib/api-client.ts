import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';
import { createAuthError } from '@/lib/auth-utils';

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig, session?: any): Promise<T> {
    try {
      const isServer = typeof window === 'undefined';

      // Use provided session or get it from client-side only
      const currentSession = session || (!isServer ? await getSession() : null);
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
        { hasSession: !!currentSession, isPublicEndpoint, hasToken: !!currentSession?.user?.token },
      );

      const client = axios.create({
        baseURL: baseURL,
        timeout: timeout,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(currentSession?.user?.token && !isPublicEndpoint
            ? { Authorization: `Bearer ${currentSession.user.token}` }
            : {}),
          ...(currentSession?.user?.id ? { 'x-user-id': currentSession.user.id } : {}),
          ...config.headers,
        },
      });

      console.log('[ApiClient] Axios client created with headers:', client.defaults.headers);

      const response: AxiosResponse<T> = await client.request(config);
      console.log(`[ApiClient] Request successful:`, {
        url: config.url,
        status: response.status,
        hasData: !!response.data,
      });
      return response.data;
    } catch (err: any) {
      console.error('[ApiClient] Error during request:', {
        url: config.url,
        error: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw createAuthError(err);
    }
  }

  static async get<T>(url: string, config?: AxiosRequestConfig, session?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config }, session);
  }

  static async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig, session?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config }, session);
  }

  static async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig, session?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config }, session);
  }

  static async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig, session?: any): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config }, session);
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig, session?: any): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config }, session);
  }
}
