import { Module } from '@nestjs/common';
import { ActionItemController } from './action-item.controller';
import { ActionItemService } from './action-item.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActionItemController],
  providers: [ActionItemService],
  exports: [ActionItemService],
})
export class ActionItemModule {}
