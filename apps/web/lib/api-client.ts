import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';
import { createAuthError } from '@/lib/auth-utils';

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig, session?: any): Promise<T> {
    try {
      const isServer = typeof window === 'undefined';

      const currentSession = session || (!isServer ? await getSession() : null);
      const isFormData = config.data instanceof FormData;

      const PUBLIC_ENDPOINTS = [
        '/api/auth/otp',
        '/api/auth/otp/verify',
        '/api/auth/otp/verify-invitation',
        '/api/auth/invitation/check-intake-form',
        '/api/auth/practitioner/signup',
        '/api/auth/client/signup',
        '/api/practitioner/invitations/token/',
        '/api/contact',
      ];

      const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint));

      const isOtpRequest = config.url?.includes('/auth/otp');
      const isAIRequest =
        config.url?.includes('/sessions') ||
        config.url?.includes('/plans/generate') ||
        config.url?.includes('/plans/generate-more-tasks') ||
        config.url?.includes('/comprehensive-summary');

      let timeout = isOtpRequest ? 30000 : isAIRequest ? 600000 : 50000;
      if (config.timeout && config.timeout > timeout) {
        timeout = config.timeout;
      }

      const useInternalUrl = isServer && process.env.DOCKER_ENV === 'true';
      const baseURL = useInternalUrl ? envConfig.internalApiUrl : envConfig.apiUrl;

      const client = axios.create({
        baseURL: baseURL,
        timeout,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(currentSession?.user?.token && !isPublicEndpoint
            ? { Authorization: `Bearer ${currentSession.user.token}` }
            : {}),
          ...(currentSession?.user?.id ? { 'x-user-id': currentSession.user.id } : {}),
          ...config.headers,
        },
      });

      const response: AxiosResponse<T> = await client.request(config);
      return response.data;
    } catch (err: any) {
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
