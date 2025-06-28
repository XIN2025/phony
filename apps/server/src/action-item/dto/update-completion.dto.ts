import { PartialType } from '@nestjs/swagger';
import { CreateCompletionDto } from './create-completion.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateCompletionDto extends PartialType(
  OmitType(CreateCompletionDto, ['actionItemId', 'clientId'] as const)
) {}
