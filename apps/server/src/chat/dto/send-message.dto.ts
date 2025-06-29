import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'The ID of the conversation to send the message to.',
    example: 'conv-id-1',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'The content of the message.',
    example: 'Hello, how are you?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
