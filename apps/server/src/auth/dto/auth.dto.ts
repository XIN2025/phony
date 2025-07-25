import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus, UserRole } from '@repo/db';
import { LoginResponse, SendOtpRequest, User, VerifyOtpRequest } from '@repo/shared-types';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class OtpAuthDto implements SendOtpRequest {
  @ApiProperty()
  @IsEmail()
  email: string;
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
  role: UserRole;
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
  role: UserRole;

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

export class UserDto implements User {
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
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  profession: string | null;

  @ApiProperty({
    type: 'string',
    enum: ClientStatus,
    nullable: true,
  })
  @IsEnum(ClientStatus)
  @IsOptional()
  clientStatus?: ClientStatus;

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
  [key: string]: unknown;
}
