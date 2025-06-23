import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession } from 'next-auth/react';

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();

    console.log(`[ApiClient:${requestId}] 🚀 Starting request at ${timestamp}`);
    console.log(`[ApiClient:${requestId}] 📡 Request details:`, {
      method: config.method?.toUpperCase(),
      url: `${envConfig.apiUrl}${config.url}`,
      baseURL: envConfig.apiUrl,
      hasData: !!config.data,
      dataType: config.data ? typeof config.data : 'none',
    });

    try {
      const isServer = typeof window === 'undefined';
      console.log(`[ApiClient:${requestId}] 🔍 Environment check: isServer=${isServer}`);

      const session = isServer ? await getServerSession(authOptions) : await getSession();
      console.log(`[ApiClient:${requestId}] 🔑 Session check:`, {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!session?.user?.token,
        userRole: session?.user?.role,
      });

      const isFormData = config.data instanceof FormData;

      const isPublicEndpoint =
        config.url?.includes('/invitations/token/') ||
        (config.url?.includes('/auth/') && !config.url?.includes('/auth/profile')) ||
        config.url?.includes('/public/');

      console.log(`[ApiClient:${requestId}] 🔓 Endpoint classification:`, {
        url: config.url,
        isPublic: isPublicEndpoint,
        needsAuth: !isPublicEndpoint,
      });

      const client = axios.create({
        baseURL: envConfig.apiUrl,
        timeout: 10000,
        headers: {
          ...(config.data && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(session?.user?.token && !isPublicEndpoint ? { Authorization: `Bearer ${session.user.token}` } : {}),
        },
      });

      console.log(`[ApiClient:${requestId}] 📤 Final request config:`, {
        baseURL: client.defaults.baseURL,
        timeout: client.defaults.timeout,
        headers: client.defaults.headers,
      });

      const response: AxiosResponse<T> = await client.request(config);
      console.log(`[ApiClient:${requestId}] ✅ Request successful:`, {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataSize: JSON.stringify(response.data).length,
        responseTime: `${Date.now() - new Date(timestamp).getTime()}ms`,
      });
      return response.data;
    } catch (err) {
      const errorTime = new Date().toISOString();
      const duration = Date.now() - new Date(timestamp).getTime();

      if (isAxiosError(err)) {
        console.error(`[ApiClient:${requestId}] ❌ Axios error after ${duration}ms:`, {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          code: err.code,
          url: config.url,
          baseURL: envConfig.apiUrl,
          fullUrl: `${envConfig.apiUrl}${config.url}`,
          requestConfig: {
            method: config.method,
            headers: config.headers,
            data: config.data,
          },
        });

        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          console.error(`[ApiClient:${requestId}] 🌐 Network error: Cannot connect to server at ${envConfig.apiUrl}`);
          throw new Error(`Cannot connect to server at ${envConfig.apiUrl}. Please check if the server is running.`);
        }

        if (err.code === 'ECONNABORTED') {
          console.error(`[ApiClient:${requestId}] ⏰ Timeout error: Request took longer than 10 seconds`);
          throw new Error('Request timed out. Please try again.');
        }

        if (err.response?.status) {
          const errorMessage = err.response?.data?.message || err.response?.statusText || 'Server error';
          console.error(`[ApiClient:${requestId}] 🔴 HTTP error: ${err.response.status} - ${errorMessage}`);
          throw new Error(`${errorMessage} (${err.response.status})`);
        }

        throw new Error(err.message || 'Network error occurred');
      }

      console.error(`[ApiClient:${requestId}] 💥 Non-axios error after ${duration}ms:`, err);
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
