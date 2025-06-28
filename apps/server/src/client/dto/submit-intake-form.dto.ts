import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitIntakeFormDto {
  @ApiProperty({
    description: 'The ID of the intake form being submitted.',
    example: '60c72b9f9b1d8e001f8e4c5e',
  })
  @IsString()
  formId: string;

  @ApiProperty({
    description: 'An object containing the answers to the form questions.',
    example: {
      question_id_1: 'Answer 1',
      question_id_2: ['Option A', 'Option C'],
    },
  })
  @IsObject()
  answers: Record<string, unknown>;
}
