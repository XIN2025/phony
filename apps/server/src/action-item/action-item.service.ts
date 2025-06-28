import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateActionItemDto {
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  source?: 'AI_SUGGESTED' | 'MANUAL';
}

interface CreateCompletionDto {
  actionItemId: string;
  clientId: string;
  rating?: number;
  journalEntry?: string;
  achievedValue?: string;
}

@Injectable()
export class ActionItemService {
  constructor(private prisma: PrismaService) {}

  async createActionItem(data: CreateActionItemDto) {
    return this.prisma.actionItem.create({
      data: {
        description: data.description,
        category: data.category,
        target: data.target,
        frequency: data.frequency,
        source: data.source || 'MANUAL',
      },
    });
  }

  async getAllActionItems() {
    return this.prisma.actionItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActionItemById(actionItemId: string) {
    const actionItem = await this.prisma.actionItem.findUnique({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      throw new NotFoundException(`ActionItem with ID ${actionItemId} not found`);
    }

    return actionItem;
  }

  async updateActionItem(actionItemId: string, data: Partial<CreateActionItemDto>) {
    await this.getActionItemById(actionItemId); // Validate exists

    return this.prisma.actionItem.update({
      where: { id: actionItemId },
      data,
    });
  }

  async deleteActionItem(actionItemId: string) {
    await this.getActionItemById(actionItemId); // Validate exists

    return this.prisma.actionItem.delete({
      where: { id: actionItemId },
    });
  }

  // Placeholder methods for completion functionality (will be implemented in future chunks)
  completeActionItem(_data: CreateCompletionDto) {
    throw new NotFoundException('ActionItem completion functionality will be implemented in future update');
  }

  getActionItemCompletions(_actionItemId: string, _clientId?: string) {
    return [];
  }

  getClientCompletions(_clientId: string, _planId?: string) {
    return [];
  }

  updateCompletion(_completionId: string, _updateData: Partial<CreateCompletionDto>) {
    throw new NotFoundException('ActionItem completion functionality will be implemented in future update');
  }

  deleteCompletion(_completionId: string) {
    throw new NotFoundException('ActionItem completion functionality will be implemented in future update');
  }
}
