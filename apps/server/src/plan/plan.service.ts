import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanStatus, ActionItemSource } from '@repo/db';
import { AiService } from '../ai/ai.service';

interface CreatePlanDto {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  actionItems: {
    description: string;
    category?: string;
    target?: string;
    frequency?: string;
    weeklyRepetitions?: number;
    isMandatory?: boolean;
    whyImportant?: string;
    recommendedActions?: string;
    toolsToHelp?: string;
    source?: (typeof ActionItemSource)[keyof typeof ActionItemSource];
    resources?: {
      type: 'LINK' | 'PDF';
      url: string;
      title?: string;
    }[];
  }[];
}

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService
  ) {}

  async createPlan(data: CreatePlanDto) {
    return await this.prisma.plan.create({
      data: {
        sessionId: data.sessionId,
        practitionerId: data.practitionerId,
        clientId: data.clientId,
        status: PlanStatus.DRAFT,
        actionItems: {
          create: data.actionItems.map((item) => ({
            description: item.description,
            category: item.category,
            target: item.target,
            frequency: item.frequency,
            weeklyRepetitions: item.weeklyRepetitions || 1,
            isMandatory: item.isMandatory || false,
            whyImportant: item.whyImportant,
            recommendedActions: item.recommendedActions,
            toolsToHelp: item.toolsToHelp,
            source: item.source || ActionItemSource.MANUAL,
            resources: {
              create: item.resources || [],
            },
          })),
        },
      },
      include: {
        actionItems: {
          include: {
            resources: true,
          },
        },
      },
    });
  }

  async publishPlan(planId: string) {
    return await this.prisma.plan.update({
      where: { id: planId },
      data: {
        status: PlanStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async getPlansByPractitioner(practitionerId: string) {
    return await this.prisma.plan.findMany({
      where: { practitionerId },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        actionItems: {
          include: {
            resources: true,
            completions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlansByClient(clientId: string) {
    return await this.prisma.plan.findMany({
      where: {
        clientId,
        status: PlanStatus.PUBLISHED,
      },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
          },
        },
        actionItems: {
          include: {
            resources: true,
            completions: {
              where: {
                clientId: clientId,
              },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getPlanById(planId: string) {
    return await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
            status: true,
            transcript: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        actionItems: {
          include: {
            resources: true,
            completions: true,
          },
        },
      },
    });
  }

  async updatePlan(planId: string, updateData: Partial<CreatePlanDto>) {
    return await this.prisma.plan.update({
      where: { id: planId },
      data: {
        ...updateData,
        actionItems: updateData.actionItems
          ? {
              deleteMany: {},
              create: updateData.actionItems.map((item) => ({
                description: item.description,
                category: item.category,
                target: item.target,
                frequency: item.frequency,
                weeklyRepetitions: item.weeklyRepetitions || 1,
                isMandatory: item.isMandatory || false,
                whyImportant: item.whyImportant,
                recommendedActions: item.recommendedActions,
                toolsToHelp: item.toolsToHelp,
                source: item.source || ActionItemSource.MANUAL,
                resources: {
                  create: item.resources || [],
                },
              })),
            }
          : undefined,
      },
      include: {
        actionItems: {
          include: {
            resources: true,
          },
        },
      },
    });
  }

  async getSuggestedActionItems(planId: string) {
    return await this.prisma.suggestedActionItem.findMany({
      where: { planId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveSuggestedActionItem(suggestedItemId: string) {
    const suggestedItem = await this.prisma.suggestedActionItem.findUnique({
      where: { id: suggestedItemId },
    });

    if (!suggestedItem) {
      throw new Error('Suggested action item not found');
    }

    const actionItem = await this.prisma.actionItem.create({
      data: {
        planId: suggestedItem.planId,
        description: suggestedItem.description,
        category: suggestedItem.category,
        target: suggestedItem.target,
        frequency: suggestedItem.frequency,
        weeklyRepetitions: suggestedItem.weeklyRepetitions || 1,
        isMandatory: suggestedItem.isMandatory || false,
        whyImportant: suggestedItem.whyImportant,
        recommendedActions: suggestedItem.recommendedActions,
        toolsToHelp: suggestedItem.toolsToHelp,
        source: ActionItemSource.AI_SUGGESTED,
      },
      include: {
        resources: true,
      },
    });

    await this.prisma.suggestedActionItem.update({
      where: { id: suggestedItemId },
      data: { status: 'APPROVED' },
    });

    return actionItem;
  }

  async rejectSuggestedActionItem(suggestedItemId: string) {
    return await this.prisma.suggestedActionItem.update({
      where: { id: suggestedItemId },
      data: { status: 'REJECTED' },
    });
  }

  async updateSuggestedActionItem(
    suggestedItemId: string,
    updateData: {
      description?: string;
      category?: string;
      target?: string;
      frequency?: string;
    }
  ) {
    return await this.prisma.suggestedActionItem.update({
      where: { id: suggestedItemId },
      data: updateData,
    });
  }

  async getPlanWithSuggestions(planId: string) {
    return await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
            status: true,
            transcript: true,
            filteredTranscript: true,
            aiSummary: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        actionItems: {
          include: {
            resources: true,
            completions: true,
          },
        },
        suggestedActionItems: {
          where: {
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async addCustomActionItem(
    planId: string,
    actionItemData: {
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
      resources?: {
        type: 'LINK' | 'PDF';
        url: string;
        title?: string;
      }[];
    }
  ) {
    return await this.prisma.actionItem.create({
      data: {
        planId,
        description: actionItemData.description,
        category: actionItemData.category,
        target: actionItemData.target,
        frequency: actionItemData.frequency,
        weeklyRepetitions: actionItemData.weeklyRepetitions || 1,
        isMandatory: actionItemData.isMandatory || false,
        whyImportant: actionItemData.whyImportant,
        recommendedActions: actionItemData.recommendedActions,
        toolsToHelp: actionItemData.toolsToHelp,
        source: ActionItemSource.MANUAL,
        resources: {
          create: actionItemData.resources || [],
        },
      },
      include: {
        resources: true,
      },
    });
  }

  async generatePlanFromSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { plan: true },
    });
    if (!session) throw new Error('Session not found');
    if (!session.transcript || !session.transcript.trim()) {
      throw new Error('Session transcript is empty. Cannot generate action plan.');
    }
    let planId = session.plan?.id;
    if (!planId) {
      const newPlan = await this.prisma.plan.create({
        data: {
          sessionId: session.id,
          practitionerId: session.practitionerId,
          clientId: session.clientId,
        },
      });
      planId = newPlan.id;
    }
    try {
      const combinedText = [session.transcript, session.aiSummary, session.notes].filter(Boolean).join('\n\n');
      const aiResults = await this.aiService.processSession(combinedText);
      await this.prisma.suggestedActionItem.deleteMany({ where: { planId } });
      if (aiResults.actionItemSuggestions?.suggestions?.length > 0) {
        const suggestedItems = aiResults.actionItemSuggestions.suggestions.map((suggestion) => {
          const s = suggestion as {
            description: string;
            category?: string;
            target?: string;
            frequency?: string;
            weeklyRepetitions?: number;
            isMandatory?: boolean;
            whyImportant?: string;
            recommendedActions?: string;
            toolsToHelp?: string;
          };
          return {
            planId: planId,
            description: s.description,
            category: s.category,
            target: s.target,
            frequency: s.frequency,
            weeklyRepetitions: s.weeklyRepetitions || 1,
            isMandatory: s.isMandatory || false,
            whyImportant: s.whyImportant,
            recommendedActions: s.recommendedActions,
            toolsToHelp: s.toolsToHelp,
          };
        });
        await this.prisma.suggestedActionItem.createMany({ data: suggestedItems });
      }
    } catch {
      // Continue, plan is still created
    }
    const plan = await this.getPlanWithSuggestions(planId);
    return JSON.parse(JSON.stringify(plan));
  }
}
