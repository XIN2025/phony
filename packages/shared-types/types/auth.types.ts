import { UserRole, ClientStatus } from '@repo/db';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  profession?: string | null;
  clientStatus?: ClientStatus;
  isEmailVerified?: boolean;
  practitionerId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
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

export type PractitionerSignUpRequest = VerifyOtpRequest & {
  firstName: string;
  lastName: string;
  profession: string;
};

export type ClientSignUpRequest = {
  email: string;
  firstName: string;
  lastName: string;
  invitationToken: string;
};
