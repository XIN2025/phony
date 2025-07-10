import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString, IsArray } from 'class-validator';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invitationToken: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  occupation: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medicalHistory?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];
}
