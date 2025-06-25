import '@testing-library/jest-dom';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendOtp, useVerifyOtp, usePractitionerSignup } from '../../lib/hooks/use-api';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types/types';

// Mock ApiClient
jest.mock('../../lib/api-client', () => ({
  ApiClient: {
    post: jest.fn(),
  },
}));

const { ApiClient } = require('../../lib/api-client');

function getWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Auth hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useVerifyOtp', () => {
    const verifyData: VerifyOtpRequest = {
      email: 'test@example.com',
      otp: '123456',
      role: 'PRACTITIONER',
    };
    const mockLoginResponse: LoginResponse = {
      token: 'jwt-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        role: 'PRACTITIONER',
        profession: 'Doctor',
      },
    };

    it('should successfully verify OTP and return login response', async () => {
      ApiClient.post.mockResolvedValueOnce(mockLoginResponse);
      const { result } = renderHook(() => useVerifyOtp(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(verifyData, {
            onSuccess: (data) => {
              expect(data).toEqual(mockLoginResponse);
              resolve(null);
            },
          });
        });
      });
      expect(ApiClient.post).toHaveBeenCalledWith('/api/auth/otp/verify', verifyData);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Invalid OTP');
      ApiClient.post.mockRejectedValueOnce(error);
      const { result } = renderHook(() => useVerifyOtp(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(verifyData, {
            onError: (err) => {
              expect(err).toBe(error);
              resolve(null);
            },
          });
        });
      });
    });
  });

  describe('useSendOtp', () => {
    const sendOtpData: SendOtpRequest = {
      email: 'test@example.com',
    };

    it('should successfully send OTP and return true', async () => {
      ApiClient.post.mockResolvedValueOnce(true);
      const { result } = renderHook(() => useSendOtp(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(sendOtpData, {
            onSuccess: (data) => {
              expect(data).toBe(true);
              resolve(null);
            },
          });
        });
      });
      expect(ApiClient.post).toHaveBeenCalledWith('/api/auth/otp', sendOtpData);
    });

    it('should handle API errors when sending OTP', async () => {
      const error = new Error('Email service unavailable');
      ApiClient.post.mockRejectedValueOnce(error);
      const { result } = renderHook(() => useSendOtp(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(sendOtpData, {
            onError: (err) => {
              expect(err).toBe(error);
              resolve(null);
            },
          });
        });
      });
    });
  });

  describe('usePractitionerSignup', () => {
    const signupData = {
      email: 'practitioner@example.com',
      otp: '123456',
      role: 'PRACTITIONER' as const,
      firstName: 'Dr.',
      lastName: 'Smith',
      profession: 'Psychologist',
    };
    const mockLoginResponse: LoginResponse = {
      token: 'practitioner-jwt-token',
      user: {
        id: 'practitioner-id',
        email: 'practitioner@example.com',
        firstName: 'Dr.',
        lastName: 'Smith',
        avatarUrl: null,
        role: 'PRACTITIONER',
        profession: 'Psychologist',
      },
    };

    it('should successfully sign up practitioner and return login response', async () => {
      ApiClient.post.mockResolvedValueOnce(mockLoginResponse);
      const { result } = renderHook(() => usePractitionerSignup(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(signupData, {
            onSuccess: (data) => {
              expect(data).toEqual(mockLoginResponse);
              resolve(null);
            },
          });
        });
      });
      expect(ApiClient.post).toHaveBeenCalledWith('/api/auth/practitioner/signup', signupData);
    });

    it('should handle API errors during signup', async () => {
      const error = new Error('Internal server error');
      ApiClient.post.mockRejectedValueOnce(error);
      const { result } = renderHook(() => usePractitionerSignup(), { wrapper: getWrapper() });
      await act(async () => {
        await new Promise((resolve) => {
          result.current.mutate(signupData, {
            onError: (err) => {
              expect(err).toBe(error);
              resolve(null);
            },
          });
        });
      });
    });
  });
});
