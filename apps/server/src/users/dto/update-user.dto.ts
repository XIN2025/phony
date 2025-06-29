import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientStatus } from '@repo/db';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: true,
    description: 'Whether the user has verified their email.',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: "The user's avatar URL.",
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
    description: "The client's status.",
    required: false,
  })
  @IsEnum(ClientStatus)
  @IsOptional()
  clientStatus?: ClientStatus;
}
