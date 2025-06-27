import { Module } from '@nestjs/common';
import { IntakeFormController } from './intake-form.controller';
import { IntakeFormService } from './intake-form.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntakeFormController],
  providers: [IntakeFormService],
  exports: [IntakeFormService],
})
export class IntakeFormModule {}
