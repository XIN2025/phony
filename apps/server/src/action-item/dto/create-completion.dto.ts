import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateCompletionDto {
  @ApiProperty({ description: 'ID of the action item being completed' })
  @IsString()
  @IsNotEmpty()
  actionItemId: string;

  @ApiProperty({ description: 'ID of the client completing the action item' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Rating for the completion (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Journal entry for the completion' })
  @IsOptional()
  @IsString()
  journalEntry?: string;

  @ApiPropertyOptional({ description: 'Achieved value for the completion' })
  @IsOptional()
  @IsString()
  achievedValue?: string;
}
