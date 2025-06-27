import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanStatus, ActionItemSource } from '@repo/db';

interface CreatePlanDto {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  actionItems: {
    description: string;
    category?: string;
    target?: string;
    frequency?: string;
    source?: ActionItemSource;
    resources?: {
      type: 'LINK' | 'PDF';
      url: string;
      title?: string;
    }[];
  }[];
}

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

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
        status: PlanStatus.PUBLISHED, // Only show published plans to clients
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
                clientId: clientId, // Only show client's own completions
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
              deleteMany: {}, // Remove existing action items
              create: updateData.actionItems.map((item) => ({
                description: item.description,
                category: item.category,
                target: item.target,
                frequency: item.frequency,
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
}
