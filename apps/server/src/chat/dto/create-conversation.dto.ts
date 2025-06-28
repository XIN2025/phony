import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'The ID of the other participant in the conversation.',
    example: 'user-id-2',
  })
  @IsString()
  @IsNotEmpty()
  participantId: string;
}
