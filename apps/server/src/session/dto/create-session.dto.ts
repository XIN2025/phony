import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'The ID of the client for this session.' })
  @IsMongoId()
  clientId: string;

  @ApiProperty({
    description: 'The date and time the session was recorded. Defaults to the current time if not provided.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: Date;
}
