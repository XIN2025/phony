import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({
    description: 'The emoji to add as a reaction.',
    example: '👍',
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
