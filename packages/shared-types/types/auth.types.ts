import { UserRole, ClientStatus } from '@repo/db';

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  profession?: string | null;
  clientStatus?: ClientStatus;
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
