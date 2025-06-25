import '@testing-library/jest-dom';
import { ApiClient } from '../../lib/api-client';
import axios from 'axios';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';

// Mock axios
jest.mock('axios');
jest.mock('next-auth');
jest.mock('next-auth/react');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock session responses
    mockGetServerSession.mockResolvedValue(null);
    mockGetSession.mockResolvedValue(null);
  });

  describe('get', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test data' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.get('/api/test');

      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = { data: 'test data' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.get('/api/test', { params: { page: 1, limit: 10 } });

      expect(result).toEqual(mockResponse);
    });

    it('should include authorization header when session exists', async () => {
      const mockResponse = { data: 'test data' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      const mockRequest = jest.fn().mockResolvedValue(mockAxiosResponse);
      mockAxios.create.mockReturnValue({
        request: mockRequest,
      } as any);

      // Mock session with token
      mockGetSession.mockResolvedValue({
        user: { token: 'test-token' },
      } as any);

      await ApiClient.get('/api/protected');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should not include authorization header for public endpoints', async () => {
      const mockResponse = { data: 'test data' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      const mockRequest = jest.fn().mockResolvedValue(mockAxiosResponse);
      mockAxios.create.mockReturnValue({
        request: mockRequest,
      } as any);

    
      mockGetSession.mockResolvedValue({
        user: { token: 'test-token' },
      } as any);

      await ApiClient.get('/api/auth/otp/send');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 30000,
        headers: {},
      });
    });

    it('should throw error for failed GET request', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' },
        },
        message: 'Request failed',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(mockAxiosError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Resource not found');
    });

    it('should handle network errors', async () => {
      const networkError = {
        isAxiosError: false,
        message: 'Network error',
      };
      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(networkError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('An unknown error occurred');
    });

    it('should handle axios errors without response data', async () => {
      const networkError = {
        isAxiosError: true,
        message: 'Network timeout',
      };
      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(networkError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Network timeout');
    });

    it('should handle non-axios errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(unexpectedError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Unexpected error');
    });
  });

  describe('post', () => {
    it('should make a successful POST request', async () => {
      const requestData = { name: 'Test', email: 'test@example.com' };
      const mockResponse = { id: 1, ...requestData };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 201,
        statusText: 'Created',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.post('/api/users', requestData);

      expect(result).toEqual(mockResponse);
    });

    it('should handle POST request without data', async () => {
      const mockResponse = { success: true };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.post('/api/logout');

      expect(result).toEqual(mockResponse);
    });

    it('should handle FormData without Content-Type header', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']));

      const mockResponse = { success: true };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      const mockRequest = jest.fn().mockResolvedValue(mockAxiosResponse);
      mockAxios.create.mockReturnValue({
        request: mockRequest,
      } as any);

      await ApiClient.post('/api/upload', formData);

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
        headers: {},
      });
    });

    it('should throw error for failed POST request', async () => {
      const requestData = { email: 'invalid-email' };
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid email format' },
        },
        message: 'Request failed',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(mockAxiosError),
      } as any);

      await expect(ApiClient.post('/api/users', requestData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('put', () => {
    it('should make a successful PUT request', async () => {
      const requestData = { name: 'Updated Test', email: 'updated@example.com' };
      const mockResponse = { id: 1, ...requestData };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.put('/api/users/1', requestData);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for failed PUT request', async () => {
      const requestData = { name: 'Test' };
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'User not found' },
        },
        message: 'Request failed',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(mockAxiosError),
      } as any);

      await expect(ApiClient.put('/api/users/999', requestData)).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should make a successful DELETE request', async () => {
      const mockResponse = { success: true };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.delete('/api/users/1');

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for failed DELETE request', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { message: 'Access denied' },
        },
        message: 'Request failed',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(mockAxiosError),
      } as any);

      await expect(ApiClient.delete('/api/users/1')).rejects.toThrow('Access denied');
    });
  });

  describe('patch', () => {
    it('should make a successful PATCH request', async () => {
      const requestData = { name: 'Partially Updated' };
      const mockResponse = { id: 1, name: 'Partially Updated', email: 'test@example.com' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      const result = await ApiClient.patch('/api/users/1', requestData);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle axios errors with response data', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error occurred' },
        },
        message: 'Request failed',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(mockAxiosError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Server error occurred');
    });

    it('should handle axios errors without response data', async () => {
      const networkError = {
        isAxiosError: true,
        message: 'Network timeout',
      };
      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(networkError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Network timeout');
    });

    it('should handle non-axios errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      mockAxios.create.mockReturnValue({
        request: jest.fn().mockRejectedValue(unexpectedError),
      } as any);

      await expect(ApiClient.get('/api/test')).rejects.toThrow('Unexpected error');
    });
  });

  describe('server vs client environment', () => {
    it('should use getServerSession on server side', async () => {
      const mockResponse = { data: 'test' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      // Mock server environment by temporarily removing window
      const originalWindow = global.window;
      delete (global as any).window;

      await ApiClient.get('/api/test');

      expect(mockGetServerSession).toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });

    it('should use getSession on client side', async () => {
      const mockResponse = { data: 'test' };
      const mockAxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      };

      mockAxios.create.mockReturnValue({
        request: jest.fn().mockResolvedValue(mockAxiosResponse),
      } as any);

      // Ensure window exists (client environment)
      if (!global.window) {
        global.window = {} as any;
      }

      await ApiClient.get('/api/test');

      expect(mockGetSession).toHaveBeenCalled();
    });
  });
});
