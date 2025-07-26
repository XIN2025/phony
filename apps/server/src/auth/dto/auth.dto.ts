import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus, UserRole } from '@repo/db';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class OtpAuthDto implements SendOtpRequest {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'string',
    enum: UserRole,
    required: false,
    description: 'Role for sign-in (CLIENT or PRACTITIONER)',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: (typeof UserRole)[keyof typeof UserRole];
}

export class VerifyOtpDto implements VerifyOtpRequest {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @IsString()
  otp: string;

  @ApiProperty({
    type: 'string',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: (typeof UserRole)[keyof typeof UserRole];
}

export class PractitionerSignUpDto implements VerifyOtpRequest {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  otp: string;

  @ApiProperty({
    type: 'string',
    enum: ['PRACTITIONER'],
    default: 'PRACTITIONER',
  })
  @IsEnum(UserRole)
  role: (typeof UserRole)[keyof typeof UserRole];

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  profession: string;
}

export class ClientSignUpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsString()
  invitationToken: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  notificationSettings?: {
    emailReminders?: boolean;
    practitionerMessages?: boolean;
    engagementPrompts?: boolean;
    marketingEmails?: boolean;
  };
}

export class UserDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  lastName: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  avatarUrl: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: false,
    properties: {
      emailReminders: { type: 'boolean' },
      practitionerMessages: { type: 'boolean' },
      engagementPrompts: { type: 'boolean' },
      marketingEmails: { type: 'boolean' },
    },
  })
  @IsOptional()
  notificationSettings?: {
    emailReminders?: boolean;
    practitionerMessages?: boolean;
    engagementPrompts?: boolean;
    marketingEmails?: boolean;
  } | null;

  @ApiProperty({
    type: 'string',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: (typeof UserRole)[keyof typeof UserRole];

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  profession: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  dob: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  practitionerId: string | null;

  @ApiProperty({
    type: 'boolean',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  idProofUrl: string | null;

  @ApiProperty({
    type: 'string',
    enum: ClientStatus,
    required: false,
  })
  @IsEnum(ClientStatus)
  @IsOptional()
  clientStatus?: (typeof ClientStatus)[keyof typeof ClientStatus];

  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  updatedAt?: Date;
}

export class LoginResponseDto implements LoginResponse {
  @ApiProperty()
  @IsString()
  token: string;
  @ApiProperty()
  @IsObject()
  user: UserDto;
}

export interface ProfileUpdateBody {
  firstName?: string;
  lastName?: string;
  profession?: string;
  dob?: string;
  phoneNumber?: string;
  notificationSettings?: {
    emailReminders?: boolean;
    practitionerMessages?: boolean;
    engagementPrompts?: boolean;
    marketingEmails?: boolean;
  };
  [key: string]: unknown;
}
