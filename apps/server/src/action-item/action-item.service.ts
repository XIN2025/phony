import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompletionDto, UpdateCompletionDto } from './dto';

@Injectable()
export class ActionItemService {
  constructor(private prisma: PrismaService) {}

  completeActionItem(data: CreateCompletionDto) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }

  getActionItemCompletions(actionItemId: string, clientId?: string) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }

  getClientCompletions(clientId: string, planId?: string) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }

  updateCompletion(completionId: string, updateData: UpdateCompletionDto) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }

  deleteCompletion(completionId: string) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }

  getActionItemById(actionItemId: string) {
    throw new NotImplementedException('This feature will be implemented in a future update.');
  }
}
