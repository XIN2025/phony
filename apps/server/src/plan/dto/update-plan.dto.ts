import { ApiProperty } from '@nestjs/swagger';
import { PlanStatus } from '@repo/db';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export class UpdatePlanDto {
  @ApiProperty({
    enum: PlanStatus,
    description: 'The status of the plan.',
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiProperty({
    description: 'The date and time the plan was published.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;
}
