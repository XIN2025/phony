import { HttpClient } from '@/lib/http-client';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types/types';

export class AuthService {
  static async verifyOtp(data: VerifyOtpRequest): Promise<LoginResponse> {
    return HttpClient.post<LoginResponse>('/api/auth/otp/verify', data);
  }

  static async verifyOtpForSignup(data: { email: string; otp: string }): Promise<boolean> {
    return HttpClient.post<boolean>('/api/auth/otp/verify-signup', data);
  }

  static async sendOtp(data: SendOtpRequest): Promise<boolean> {
    return HttpClient.post<boolean>('/api/auth/otp', data);
  }

  static async signupPractitioner(data: {
    email: string;
    otp: string;
    role: 'PRACTITIONER';
    firstName: string;
    lastName: string;
    profession: string;
  }): Promise<LoginResponse> {
    return HttpClient.post<LoginResponse>('/api/auth/practitioner/signup', data);
  }

  static async clientSignup(data: {
    email: string;
    firstName: string;
    lastName: string;
    invitationToken: string;
  }): Promise<LoginResponse> {
    return HttpClient.post<LoginResponse>('/api/auth/client/signup', data);
  }
}
