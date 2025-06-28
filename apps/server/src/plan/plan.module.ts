import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { PlanService } from './plan.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
