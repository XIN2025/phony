import { UserRole, ClientStatus } from '@repo/db';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  role: (typeof UserRole)[keyof typeof UserRole];
  profession: string | null;
  clientStatus?: (typeof ClientStatus)[keyof typeof ClientStatus];
  isEmailVerified: boolean;
  practitionerId: string | null;
  idProofUrl: string | null;
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
  role: (typeof UserRole)[keyof typeof UserRole];
};

export type SendOtpRequest = {
  email: string;
};

export type PractitionerSignUpRequest = VerifyOtpRequest & {
  firstName: string;
  lastName?: string;
  profession: string;
};

export type ClientSignUpRequest = {
  email: string;
  firstName: string;
  lastName?: string;
  invitationToken: string;
};
