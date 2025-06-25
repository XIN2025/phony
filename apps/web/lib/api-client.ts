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
      const publicEndpoints = [
        '/api/auth/otp/send',
        '/api/auth/otp/verify',
        '/api/auth/practitioner/signup',
        '/api/auth/client/signup',
        '/api/invitations/token/',
      ];

      const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

      // Use longer timeout for OTP requests
      const isOtpRequest = config.url?.includes('/auth/otp');
      const timeout = isOtpRequest ? 30000 : 10000; // 30 seconds for OTP, 10 seconds for others

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
      if (isAxiosError(err)) {
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
