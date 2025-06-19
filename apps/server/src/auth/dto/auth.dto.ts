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
}
export class LoginResponseDto implements LoginResponse {
  @ApiProperty()
  @IsString()
  token: string;
  @ApiProperty()
  @IsObject()
  user: UserDto;
}
