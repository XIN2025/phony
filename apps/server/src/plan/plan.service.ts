import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanStatus, ActionItemSource } from '@repo/db';
import { AiService } from '../ai/ai.service';
import * as webpush from 'web-push';
import { ConfigService } from '@nestjs/config';

interface CreatePlanDto {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  actionItems: {
    description: string;
    category?: string;
    target?: string;
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
    daysOfWeek?: string[];
  }[];
}

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private config: ConfigService
  ) {
    // Configure web-push with VAPID keys from env
    const vapidPublicKey = this.config.get('vapid.publicKey');
    const vapidPrivateKey = this.config.get('vapid.privateKey');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Push] VAPID keys not configured. Push notifications will be disabled.');
      console.warn('[Push] Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
    } else {
      try {
        webpush.setVapidDetails('mailto:support@continuum.com', vapidPublicKey, vapidPrivateKey);
        console.log('[Push] VAPID configuration successful');
      } catch (error) {
        console.error('[Push] Failed to configure VAPID:', error);
      }
    }
  }

  async createPlan(data: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
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
            weeklyRepetitions: item.weeklyRepetitions || 1,
            isMandatory: item.isMandatory || false,
            whyImportant: item.whyImportant,
            recommendedActions: item.recommendedActions,
            toolsToHelp: item.toolsToHelp,
            source: item.source || ActionItemSource.MANUAL,
            daysOfWeek: item.daysOfWeek || [],
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

    await this.prisma.session.update({
      where: { id: data.sessionId },
      data: {
        plan: {
          connect: { id: plan.id },
        },
      },
    });

    return plan;
  }

  async publishPlan(planId: string) {
    const plan = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        status: PlanStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { client: true },
    });
    // Send push notification to client
    await this.sendPushToClient(plan.clientId, {
      title: 'New Plan Published',
      body: 'Your practitioner has published a new plan for you!',
      url: '/',
    });
    return plan;
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

  async getMostRecentPublishedPlanByClient(clientId: string) {
    const result = await this.prisma.plan.findFirst({
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
            completions: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
    return result;
  }

  async getPlansByClient(clientId: string) {
    const plan = await this.getMostRecentPublishedPlanByClient(clientId);
    return plan ? [plan] : [];
  }

  async getPlanById(planId: string) {
    return await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
            title: true,
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
                weeklyRepetitions: item.weeklyRepetitions || 1,
                isMandatory: item.isMandatory || false,
                whyImportant: item.whyImportant,
                recommendedActions: item.recommendedActions,
                toolsToHelp: item.toolsToHelp,
                source: item.source || ActionItemSource.MANUAL,
                daysOfWeek: item.daysOfWeek || [],
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
    }
  ) {
    return await this.prisma.suggestedActionItem.update({
      where: { id: suggestedItemId },
      data: updateData,
    });
  }

  async getPlanWithSuggestions(planId: string) {
    const plan = await this.prisma.plan.findUnique({
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

    if (!plan) {
      return null;
    }

    return plan;
  }

  async addCustomActionItem(
    planId: string,
    actionItemData: {
      description: string;
      category?: string;
      target?: string;
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
      daysOfWeek?: string[];
    }
  ) {
    return await this.prisma.actionItem.create({
      data: {
        planId,
        description: actionItemData.description,
        category: actionItemData.category,
        target: actionItemData.target,
        weeklyRepetitions: actionItemData.weeklyRepetitions || 1,
        isMandatory: actionItemData.isMandatory || false,
        whyImportant: actionItemData.whyImportant,
        recommendedActions: actionItemData.recommendedActions,
        toolsToHelp: actionItemData.toolsToHelp,
        daysOfWeek: actionItemData.daysOfWeek || [],
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
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { plan: true },
      });

      if (!session) {
        throw new Error('Session not found');
      }

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

        if (
          aiResults.actionItemSuggestions?.sessionTasks?.length > 0 ||
          aiResults.actionItemSuggestions?.complementaryTasks?.length > 0
        ) {
          try {
            const sessionTaskItems = (aiResults.actionItemSuggestions.sessionTasks || []).map((s) => ({
              planId: planId,
              description: s.description,
              category: s.category,
              target: s.target,
              weeklyRepetitions:
                typeof s.weeklyRepetitions === 'string'
                  ? parseInt(s.weeklyRepetitions, 10) || 1
                  : s.weeklyRepetitions || 1,
              isMandatory: s.isMandatory || false,
              whyImportant: s.whyImportant,
              recommendedActions: s.recommendedActions,
              toolsToHelp: normalizeToolsToHelp(s.toolsToHelp),
              source: ActionItemSource.MANUAL,
            }));
            const complementaryTaskItems = (aiResults.actionItemSuggestions.complementaryTasks || []).map((s) => ({
              planId: planId,
              description: s.description,
              category: s.category,
              target: s.target,
              weeklyRepetitions:
                typeof s.weeklyRepetitions === 'string'
                  ? parseInt(s.weeklyRepetitions, 10) || 1
                  : s.weeklyRepetitions || 1,
              isMandatory: s.isMandatory || false,
              whyImportant: s.whyImportant,
              recommendedActions: s.recommendedActions,
              toolsToHelp: normalizeToolsToHelp(s.toolsToHelp),
              source: ActionItemSource.AI_SUGGESTED,
            }));
            const actionItemData = [...sessionTaskItems, ...complementaryTaskItems];
            if (actionItemData.length > 0) {
              await this.prisma.actionItem.createMany({ data: actionItemData });
            }
          } catch (createError) {
            console.error(`[PlanService] Error creating action items:`, createError);
            console.error(`[PlanService] Error details:`, createError.message);
            throw new Error(`Failed to create action items: ${createError.message}`);
          }
        }
      } catch (err) {
        console.error(`[PlanService] Error during AI processing or database operations:`, err);
        console.error(`[PlanService] Error stack:`, err.stack);
        throw new Error(`Failed to generate action items: ${err.message}`);
      }

      const plan = await this.getPlanWithSuggestions(planId);
      if (!plan) {
        throw new Error(`Failed to retrieve plan ${planId} after generation`);
      }

      return JSON.parse(JSON.stringify(plan));
    } catch (err) {
      console.error(`[PlanService] Fatal error in generatePlanFromSession:`, err);
      console.error(`[PlanService] Error stack:`, err.stack);
      throw err;
    }
  }

  async updateActionItem(
    planId: string,
    actionItemId: string,
    updateData: {
      description?: string;
      category?: string;
      target?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
      resources?: {
        type: 'LINK' | 'PDF' | 'IMAGE' | 'DOCX';
        url: string;
        title?: string;
      }[];
      daysOfWeek?: string[];
    }
  ) {
    const actionItem = await this.prisma.actionItem.findFirst({
      where: { id: actionItemId, planId },
    });
    if (!actionItem) {
      throw new Error('Resource not found. Please check the URL.');
    }

    const updatePayload = {
      description: updateData.description,
      category: updateData.category,
      target: updateData.target,
      weeklyRepetitions: updateData.weeklyRepetitions,
      isMandatory: updateData.isMandatory,
      whyImportant: updateData.whyImportant,
      recommendedActions: updateData.recommendedActions,
      toolsToHelp: updateData.toolsToHelp,
      daysOfWeek: updateData.daysOfWeek || [],
      resources: updateData.resources
        ? {
            deleteMany: {},
            create: updateData.resources,
          }
        : undefined,
    };

    const updated = await this.prisma.actionItem.update({
      where: { id: actionItemId },
      data: updatePayload,
      include: { resources: true },
    });

    // Send push notification to client
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (plan) {
      await this.sendPushToClient(plan.clientId, {
        title: 'Plan Updated',
        body: 'Your practitioner has updated your action plan tasks.',
        url: '/',
      });
    }
    return updated;
  }

  async deleteActionItem(planId: string, actionItemId: string) {
    const actionItem = await this.prisma.actionItem.findFirst({
      where: { id: actionItemId, planId },
    });
    if (!actionItem) {
      throw new Error('Resource not found. Please check the URL.');
    }
    await this.prisma.actionItem.delete({ where: { id: actionItemId } });
    return { success: true };
  }

  async generateMoreComplementaryTasks(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        session: true,
        actionItems: true,
        suggestedActionItems: true,
      },
    });

    if (!plan) throw new Error('Plan not found');
    if (!plan.session) throw new Error('Session not found for this plan');

    const session = plan.session;
    if (!session.transcript || !session.transcript.trim()) {
      throw new Error('Session transcript is empty. Cannot generate additional tasks.');
    }

    try {
      const existingSessionTasks = plan.actionItems.map((item) => item.description);
      const existingComplementaryTasks = plan.suggestedActionItems.map((item) => item.description);

      const sessionData = [session.transcript, session.aiSummary, session.notes].filter(Boolean).join('\n\n');

      const aiResults = await this.aiService.generateAdditionalComplementaryTasks(
        sessionData,
        existingSessionTasks,
        existingComplementaryTasks
      );

      if (aiResults.complementaryTasks?.length > 0) {
        const complementaryItems = aiResults.complementaryTasks.map((s) => ({
          planId: planId,
          description: s.description,
          category: s.category,
          target: s.target,
          weeklyRepetitions:
            typeof s.weeklyRepetitions === 'string' ? parseInt(s.weeklyRepetitions, 10) || 1 : s.weeklyRepetitions || 1,
          isMandatory: s.isMandatory || false,
          whyImportant: s.whyImportant,
          recommendedActions: Array.isArray(s.recommendedActions)
            ? s.recommendedActions.join('\n')
            : s.recommendedActions,
          toolsToHelp: normalizeToolsToHelp(s.toolsToHelp),
          source: ActionItemSource.AI_SUGGESTED,
        }));
        if (complementaryItems.length > 0) {
          await this.prisma.actionItem.createMany({ data: complementaryItems });
        }
      }
    } catch (err) {
      console.error('Error generating more tasks:', err);
      throw new Error(`Failed to generate additional complementary tasks: ${err.message}`);
    }

    const updatedPlan = await this.getPlanWithSuggestions(planId);
    if (!updatedPlan) {
      throw new Error('Failed to retrieve updated plan');
    }

    return JSON.parse(JSON.stringify(updatedPlan));
  }

  async getClientActionItemsInRange(clientId: string, start: string, end: string) {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const plans = await this.prisma.plan.findMany({
      where: {
        clientId,
        status: PlanStatus.PUBLISHED,
      },
      include: {
        session: {
          select: {
            id: true,
            recordedAt: true,
            title: true,
          },
        },
        actionItems: {
          select: {
            id: true,
            description: true,
            category: true,
            target: true,
            weeklyRepetitions: true,
            isMandatory: true,
            whyImportant: true,
            recommendedActions: true,
            toolsToHelp: true,
            source: true,
            daysOfWeek: true,
            resources: true,
            completions: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Filter action items by date range relevance, but do NOT filter their completions array
    const allActionItems = plans.flatMap((plan) => {
      return plan.actionItems
        .map((item) => {
          // Determine if the action item is relevant for the date range
          const hasCompletionsInRange = (item.completions || []).some((completion) => {
            const completionDate = completion.completionDate || completion.completedAt;
            if (!completionDate) return false;
            const date = new Date(completionDate);
            return date >= startDate && date <= endDate;
          });

          // Check if task is scheduled for any day in the selected range
          let isScheduledInRange = false;
          if (item.daysOfWeek && item.daysOfWeek.length > 0) {
            const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dayShort = dayMap[d.getDay()];
              if (item.daysOfWeek.includes(dayShort)) {
                isScheduledInRange = true;
                break;
              }
            }
          } else {
            isScheduledInRange = true;
          }

          if (hasCompletionsInRange || isScheduledInRange) {
            return {
              ...item,
              // DO NOT filter completions here
              planId: plan.id,
              planPublishedAt: plan.publishedAt,
              sessionDate: plan.session?.recordedAt,
              session: plan.session,
            };
          }
          return null;
        })
        .filter(Boolean);
    });

    return allActionItems;
  }

  async getActivePlanForDate(clientId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(23, 59, 59, 999);

    const plan = await this.prisma.plan.findFirst({
      where: {
        clientId,
        status: 'PUBLISHED',
        publishedAt: { lte: targetDate },
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        actionItems: {
          include: {
            resources: true,
            completions: true,
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
      },
    });
    return plan;
  }

  private async sendPushToClient(clientId: string, notification: { title: string; body: string; url?: string }) {
    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId: clientId } });

    if (subscriptions.length === 0) {
      console.log(`[Push] No push subscriptions found for client ${clientId}`);
      return;
    }

    console.log(`[Push] Found ${subscriptions.length} subscription(s) for client ${clientId}`);

    for (const sub of subscriptions) {
      try {
        console.log(`[Push] Sending notification to subscription ${sub.id} for client ${clientId}`);

        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          url: '/', // Always send client to home page
          timestamp: Date.now(),
        });

        console.log(`[Push] Payload size: ${payload.length} bytes`);

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload,
          {
            TTL: 86400, // 24 hours in seconds
            urgency: 'high',
            topic: 'plan-updates',
          }
        );

        console.log(`[Push] Successfully sent notification to subscription ${sub.id}`);
      } catch (err) {
        console.error(`[Push] Failed to send notification to subscription ${sub.id}:`, err);

        // Handle unsubscribed endpoints
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push] Removing invalid subscription ${sub.id} (status: ${err.statusCode})`);
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else if (err.statusCode === 413) {
          console.error(`[Push] Payload too large for subscription ${sub.id}`);
        } else if (err.statusCode === 429) {
          console.error(`[Push] Rate limited for subscription ${sub.id}`);
        } else {
          console.error(`[Push] Unknown error for subscription ${sub.id}:`, err.message);
        }
      }
    }
  }

  // Test method for push notifications
  async testPushNotification(clientId: string) {
    console.log(`[Push] Testing push notification for client ${clientId}`);

    try {
      await this.sendPushToClient(clientId, {
        title: 'Test Notification',
        body: 'This is a test push notification from Continuum.',
        url: '/',
      });

      console.log(`[Push] Test notification sent successfully for client ${clientId}`);
      return { success: true, message: 'Test notification sent' };
    } catch (error) {
      console.error(`[Push] Test notification failed for client ${clientId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

function normalizeToolsToHelp(toolsToHelp: unknown): string | undefined {
  if (!toolsToHelp) return undefined;
  if (typeof toolsToHelp === 'string') return toolsToHelp;
  if (Array.isArray(toolsToHelp)) {
    return toolsToHelp
      .map((tool) =>
        tool.link ? `${tool.name} (${tool.whatItEnables}) - ${tool.link}` : `${tool.name} (${tool.whatItEnables})`
      )
      .join('\n');
  }
  return undefined;
}
