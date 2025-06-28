import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateActionItemDto {
  @ApiProperty({ description: 'Description of the action item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Category of the action item' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Target for the action item' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ description: 'Frequency of the action item' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Source of the action item',
    enum: ['AI_SUGGESTED', 'MANUAL'],
    default: 'MANUAL',
  })
  @IsOptional()
  @IsIn(['AI_SUGGESTED', 'MANUAL'])
  source?: 'AI_SUGGESTED' | 'MANUAL';
}
