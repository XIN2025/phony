import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession } from 'next-auth/react';
export class ApiClient {
  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const isServer = typeof window === 'undefined';
      const session = isServer ? await getServerSession(authOptions) : await getSession();
      const isFormData = config.data instanceof FormData;

      // Define public endpoints that don't require authentication
      const isPublicEndpoint =
        config.url?.includes('/invitations/token/') ||
        (config.url?.includes('/auth/') &&
          !config.url?.includes('/auth/profile') &&
          !config.url?.includes('/auth/me')) ||
        config.url?.includes('/public/');

      const client = axios.create({
        baseURL: envConfig.apiUrl,
        timeout: 10000,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(session?.user?.token && !isPublicEndpoint ? { Authorization: `Bearer ${session.user.token}` } : {}),
        },
      });
      const response: AxiosResponse<T> = await client.request(config);
      return response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        console.error('ApiClient error:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
        });

        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          throw new Error(`Cannot connect to server at ${envConfig.apiUrl}. Please check if the server is running.`);
        }
        if (err.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (err.response?.status) {
          const errorMessage = err.response?.data?.message || err.response?.statusText || 'Server error';
          throw new Error(`${errorMessage} (${err.response.status})`);
        }
        throw new Error(err.message || 'Network error occurred');
      }
      throw new Error(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }
  static async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: 'POST', url, data });
  }
  static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }
  static async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data });
  }
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}
