import { envConfig } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';

export class HttpClient {
  private static baseURL = envConfig.apiUrl;

  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const client = axios.create({
        baseURL: this.baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      const response: AxiosResponse<T> = await client.request(config);
      return response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          throw new Error(`Cannot connect to server at ${this.baseURL}. Please check if the server is running.`);
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
