import '@testing-library/jest-dom';
import { AuthService } from '../../services/auth.service';
import { ApiClient } from '../../lib/api-client';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types/types';

// Mock the ApiClient
jest.mock('../../lib/api-client');

const mockApiClient = ApiClient as jest.Mocked<typeof ApiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyOtp', () => {
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
      mockApiClient.post.mockResolvedValue(mockLoginResponse);

      const result = await AuthService.verifyOtp(verifyData);

      expect(result).toEqual(mockLoginResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp/verify', verifyData);
    });

    it('should handle verification for client role', async () => {
      const clientVerifyData: VerifyOtpRequest = {
        email: 'client@example.com',
        otp: '654321',
        role: 'CLIENT',
      };

      const clientLoginResponse: LoginResponse = {
        token: 'client-jwt-token',
        user: {
          id: 'client-id',
          email: 'client@example.com',
          firstName: 'Client',
          lastName: 'User',
          avatarUrl: null,
          role: 'CLIENT',
          profession: null,
        },
      };

      mockApiClient.post.mockResolvedValue(clientLoginResponse);

      const result = await AuthService.verifyOtp(clientVerifyData);

      expect(result).toEqual(clientLoginResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp/verify', clientVerifyData);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Invalid OTP');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.verifyOtp(verifyData)).rejects.toThrow('Invalid OTP');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp/verify', verifyData);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(networkError);

      await expect(AuthService.verifyOtp(verifyData)).rejects.toThrow('Network error');
    });
  });

  describe('sendOtp', () => {
    const sendOtpData: SendOtpRequest = {
      email: 'test@example.com',
    };

    it('should successfully send OTP and return true', async () => {
      mockApiClient.post.mockResolvedValue(true);

      const result = await AuthService.sendOtp(sendOtpData);

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp', sendOtpData);
    });

    it('should handle API errors when sending OTP', async () => {
      const error = new Error('Email service unavailable');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.sendOtp(sendOtpData)).rejects.toThrow('Email service unavailable');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp', sendOtpData);
    });

    it('should handle invalid email format', async () => {
      const invalidEmailData: SendOtpRequest = {
        email: 'invalid-email',
      };

      const error = new Error('Invalid email format');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.sendOtp(invalidEmailData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('signupPractitioner', () => {
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
      mockApiClient.post.mockResolvedValue(mockLoginResponse);

      const result = await AuthService.signupPractitioner(signupData);

      expect(result).toEqual(mockLoginResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/practitioner/signup', signupData);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        email: 'practitioner@example.com',
        otp: '123456',
        role: 'PRACTITIONER' as const,
        firstName: '',
        lastName: '',
        profession: '',
      };

      const error = new Error('Name and profession are required');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.signupPractitioner(incompleteData)).rejects.toThrow('Name and profession are required');
    });

    it('should handle invalid OTP during signup', async () => {
      const error = new Error('Invalid OTP');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.signupPractitioner(signupData)).rejects.toThrow('Invalid OTP');
    });

    it('should handle email already exists error', async () => {
      const error = new Error('Email already exists');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.signupPractitioner(signupData)).rejects.toThrow('Email already exists');
    });

    it('should handle server errors during signup', async () => {
      const error = new Error('Internal server error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.signupPractitioner(signupData)).rejects.toThrow('Internal server error');
    });
  });

  describe('API client integration', () => {
    it('should use correct API endpoints', async () => {
      const verifyData: VerifyOtpRequest = {
        email: 'test@example.com',
        otp: '123456',
        role: 'PRACTITIONER',
      };

      const sendOtpData: SendOtpRequest = {
        email: 'test@example.com',
      };

      const signupData = {
        email: 'practitioner@example.com',
        otp: '123456',
        role: 'PRACTITIONER' as const,
        firstName: 'Dr.',
        lastName: 'Smith',
        profession: 'Psychologist',
      };

      // Mock successful responses
      mockApiClient.post.mockResolvedValue({ token: 'test', user: {} as any });

      // Call methods to verify endpoints
      await AuthService.verifyOtp(verifyData);
      await AuthService.sendOtp(sendOtpData);
      await AuthService.signupPractitioner(signupData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp/verify', verifyData);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/otp', sendOtpData);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/practitioner/signup', signupData);
    });

    it('should handle different response types correctly', async () => {
      // Test boolean response for sendOtp
      mockApiClient.post.mockResolvedValue(true);
      const sendOtpResult = await AuthService.sendOtp({ email: 'test@example.com' });
      expect(sendOtpResult).toBe(true);

      // Test object response for verifyOtp
      const loginResponse: LoginResponse = {
        token: 'token',
        user: {
          id: 'id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: null,
          role: 'PRACTITIONER',
          profession: 'Doctor',
        },
      };
      mockApiClient.post.mockResolvedValue(loginResponse);
      const verifyResult = await AuthService.verifyOtp({
        email: 'test@example.com',
        otp: '123456',
        role: 'PRACTITIONER',
      });
      expect(verifyResult).toEqual(loginResponse);
    });
  });
});
