import { ApiClient } from '@/lib/api-client';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types/types';

export class AuthService {
  static async verifyOtp(data: VerifyOtpRequest) {
    return await ApiClient.post<LoginResponse>('/api/auth/otp/verify', data);
  }
  static async sendOtp(data: SendOtpRequest) {
    return await ApiClient.post<boolean>('/api/auth/otp', data);
  }
  static async signupPractitioner(data: {
    email: string;
    otp: string;
    role: 'PRACTITIONER';
    name: string;
    profession: string;
  }) {
    return await ApiClient.post<LoginResponse>('/api/auth/practitioner/signup', data);
  }
}
