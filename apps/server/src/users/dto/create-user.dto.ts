import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@repo/db';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "The user's email address.",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John', description: "The user's first name." })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "The user's last name." })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.CLIENT,
    description: 'The role of the user.',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    example: 'Psychologist',
    description: "The user's profession (optional).",
    required: false,
  })
  @IsString()
  @IsOptional()
  profession?: string;

  @ApiProperty({
    example: '60d5f9f8f8f8f8f8f8f8f8f8',
    description: "The ID of the user's practitioner (optional).",
    required: false,
  })
  @IsString()
  @IsOptional()
  practitionerId?: string;
}
