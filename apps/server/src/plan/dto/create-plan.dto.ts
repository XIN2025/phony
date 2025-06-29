import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ description: 'The ID of the session to associate the plan with.' })
  @IsMongoId()
  sessionId: string;
}
