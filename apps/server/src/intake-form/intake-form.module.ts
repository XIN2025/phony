import { Module } from '@nestjs/common';
import { IntakeFormController } from './intake-form.controller';
import { IntakeFormService } from './intake-form.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntakeFormController],
  providers: [IntakeFormService],
})
export class IntakeFormModule {}
