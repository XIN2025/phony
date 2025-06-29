import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '@repo/db';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSessionDto {
  @ApiProperty({
    enum: SessionStatus,
    description: 'The current status of the session.',
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({
    description: "The URL of the session's audio file.",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  audioFileUrl?: string;

  @ApiProperty({
    description: 'The transcript of the session.',
    required: false,
  })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiProperty({
    description: 'The ID of the transcription job.',
    required: false,
  })
  @IsOptional()
  @IsString()
  transcriptionJobId?: string;
}
