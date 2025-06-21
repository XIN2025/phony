import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { LoginResponse, SendOtpRequest, User, VerifyOtpRequest } from '@repo/shared-types/types';
import { UserRole } from '@repo/db';

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
  name: string;

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

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  name: string | null;

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
}
export class LoginResponseDto implements LoginResponse {
  @ApiProperty()
  @IsString()
  token: string;
  @ApiProperty()
  @IsObject()
  user: UserDto;
}
