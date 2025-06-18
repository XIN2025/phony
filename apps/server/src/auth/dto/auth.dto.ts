import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { LoginResponse, User } from '@repo/shared-types/types';
import { UserRole } from '@repo/db';

export class GoogleAuthDto {
  @ApiProperty({ description: 'The ID token from Google' })
  @IsString()
  idToken: string;
}

export class OtpAuthDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @IsString()
  otp: string;
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
