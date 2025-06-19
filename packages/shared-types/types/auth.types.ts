import { UserRole } from '@repo/db';

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
  role: UserRole;
};

export type SendOtpRequest = {
  email: string;
};
