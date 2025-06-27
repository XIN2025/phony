import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async completeActionItem(data: CreateCompletionDto) {
    return await this.prisma.actionItemCompletion.create({
      data: {
        actionItemId: data.actionItemId,
        clientId: data.clientId,
        rating: data.rating,
        journalEntry: data.journalEntry,
        achievedValue: data.achievedValue,
      },
      include: {
        actionItem: {
          select: {
            id: true,
            description: true,
            category: true,
            target: true,
            frequency: true,
          },
        },
      },
    });
  }

  async getActionItemCompletions(actionItemId: string, clientId?: string) {
    return await this.prisma.actionItemCompletion.findMany({
      where: {
        actionItemId,
        ...(clientId && { clientId }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        actionItem: {
          select: {
            id: true,
            description: true,
            category: true,
            target: true,
            frequency: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async getClientCompletions(clientId: string, planId?: string) {
    return await this.prisma.actionItemCompletion.findMany({
      where: {
        clientId,
        ...(planId && {
          actionItem: {
            planId: planId,
          },
        }),
      },
      include: {
        actionItem: {
          select: {
            id: true,
            description: true,
            category: true,
            target: true,
            frequency: true,
            planId: true,
            plan: {
              select: {
                id: true,
                session: {
                  select: {
                    recordedAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async updateCompletion(completionId: string, updateData: Partial<CreateCompletionDto>) {
    return await this.prisma.actionItemCompletion.update({
      where: { id: completionId },
      data: {
        rating: updateData.rating,
        journalEntry: updateData.journalEntry,
        achievedValue: updateData.achievedValue,
      },
      include: {
        actionItem: {
          select: {
            id: true,
            description: true,
            category: true,
            target: true,
            frequency: true,
          },
        },
      },
    });
  }

  async deleteCompletion(completionId: string) {
    return await this.prisma.actionItemCompletion.delete({
      where: { id: completionId },
    });
  }

  async getActionItemById(actionItemId: string) {
    return await this.prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        plan: {
          select: {
            id: true,
            clientId: true,
            practitionerId: true,
            status: true,
          },
        },
        resources: true,
        completions: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });
  }
}
