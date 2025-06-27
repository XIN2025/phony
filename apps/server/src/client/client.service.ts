import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, GoalType } from '@repo/db';
import { updateClientStatus, throwAuthError } from 'src/common/utils/user.utils';

@Injectable()
export class ClientService {
  constructor(private readonly prismaService: PrismaService) {}

  async getIntakeForm(clientId: string) {
    const client = await this.prismaService.user.findUnique({
      where: { id: clientId },
    });

    if (!client || client.role !== UserRole.CLIENT) {
      throwAuthError('Client not found', 'notFound');
    }

    const invitation = await this.prismaService.invitation.findFirst({
      where: {
        clientEmail: client.email,
        practitionerId: client.practitionerId || undefined,
        isAccepted: true,
      },
      include: {
        intakeForm: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!invitation) {
      throwAuthError('No invitation found for this client', 'notFound');
    }

    if (!invitation.intakeForm) {
      throwAuthError('No intake form attached to this invitation', 'notFound');
    }

    const existingSubmission = await this.prismaService.intakeFormSubmission.findFirst({
      where: {
        clientId: clientId,
        formId: invitation.intakeForm.id,
      },
    });

    const newStatus = updateClientStatus(client.clientStatus ?? 'ACTIVE', !!existingSubmission);

    if (client.clientStatus !== newStatus) {
      await this.prismaService.user.update({
        where: { id: clientId },
        data: { clientStatus: newStatus },
      });
    }

    if (existingSubmission) {
      throwAuthError('Client has already completed intake', 'badRequest');
    }

    return {
      id: invitation.intakeForm.id,
      title: invitation.intakeForm.title,
      description: invitation.intakeForm.description,
      questions: invitation.intakeForm.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        isRequired: q.isRequired,
        order: q.order,
      })),
    };
  }

  async submitIntakeForm(clientId: string, formId: string, answers: Record<string, unknown>) {
    try {
      const client = await this.prismaService.user.findUnique({ where: { id: clientId } });

      if (!client || client.role !== UserRole.CLIENT) {
        throwAuthError('Client not found', 'notFound');
      }

      const form = await this.prismaService.intakeForm.findFirst({
        where: { id: formId, practitionerId: client.practitionerId || undefined },
        include: { questions: true },
      });

      if (!form) {
        throwAuthError('Intake form not found', 'notFound');
      }

      const existingSubmission = await this.prismaService.intakeFormSubmission.findFirst({
        where: { clientId: clientId, formId: formId },
      });

      if (existingSubmission) {
        throwAuthError('You have already submitted this intake form', 'badRequest');
      }

      const submission = await this.prismaService.intakeFormSubmission.create({
        data: { clientId: clientId, formId: formId },
      });

      const answerData = form.questions
        .map((question) => {
          const answer = answers[question.id];
          if (answer !== undefined && answer !== null && answer !== '') {
            return {
              submissionId: submission.id,
              questionId: question.id,
              value: JSON.stringify(answer),
            };
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (answerData.length > 0) {
        await this.prismaService.answer.createMany({ data: answerData });
      }

      const newStatus = updateClientStatus(client.clientStatus ?? 'ACTIVE', true);
      await this.prismaService.user.update({
        where: { id: clientId },
        data: { clientStatus: newStatus },
      });

      const result = {
        message: 'Intake form submitted successfully',
        clientStatus: newStatus,
        submissionId: submission.id,
      };

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Connection')) {
        throwAuthError('Database connection error. Please try again.', 'badRequest');
      }

      if (error instanceof Error) {
        throw error;
      } else {
        throwAuthError('Failed to submit intake form', 'badRequest');
      }
    }
  }

  async fixClientStatuses() {
    const clientsToFix = await this.prismaService.user.findMany({
      where: {
        role: UserRole.CLIENT,
        clientStatus: 'INTAKE_COMPLETED',
      },
      include: {
        _count: {
          select: { intakeFormSubmissions: true },
        },
      },
    });

    const clientsWithoutSubmissions = clientsToFix.filter((client) => client._count.intakeFormSubmissions === 0);

    if (clientsWithoutSubmissions.length === 0) {
      return {
        message: 'No client statuses need fixing',
        fixedCount: 0,
      };
    }

    const newStatus = updateClientStatus('INTAKE_COMPLETED', false);
    await this.prismaService.user.updateMany({
      where: {
        id: { in: clientsWithoutSubmissions.map((c) => c.id) },
      },
      data: {
        clientStatus: newStatus,
      },
    });

    return {
      message: `Fixed ${clientsWithoutSubmissions.length} client statuses`,
      fixedCount: clientsWithoutSubmissions.length,
    };
  }

  async createGoal(clientId: string, data: { type: string; title: string; target: string; frequency: string }) {
    const client = await this.prismaService.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== UserRole.CLIENT) {
      throwAuthError('Client not found', 'notFound');
    }
    if (!client.practitionerId) {
      throwAuthError('Client does not have a practitioner', 'badRequest');
    }
    const goal = await this.prismaService.goal.create({
      data: {
        clientId,
        practitionerId: client.practitionerId,
        type: data.type as GoalType,
        title: data.title,
        target: data.target,
        frequency: data.frequency,
      },
    });
    return goal;
  }

  getGoals(clientId: string) {
    return this.prismaService.goal.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { tasks: true },
    });
  }

  async updateGoal(clientId: string, goalId: string, data: { title?: string; target?: string; frequency?: string }) {
    const goal = await this.prismaService.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.clientId !== clientId) {
      throwAuthError('Goal not found or not owned by client', 'notFound');
    }
    return this.prismaService.goal.update({
      where: { id: goalId },
      data,
    });
  }

  async createTask(clientId: string, data: { goalId: string; date: Date; feedback?: string; achieved?: string }) {
    const goal = await this.prismaService.goal.findUnique({ where: { id: data.goalId } });
    if (!goal || goal.clientId !== clientId) {
      throwAuthError('Goal not found or not owned by client', 'notFound');
    }
    const existing = await this.prismaService.task.findFirst({ where: { goalId: data.goalId, date: data.date } });
    if (existing) {
      return this.prismaService.task.update({
        where: { id: existing.id },
        data: { feedback: data.feedback, achieved: data.achieved, completed: true },
      });
    }
    return this.prismaService.task.create({
      data: {
        goalId: data.goalId,
        date: data.date,
        feedback: data.feedback,
        achieved: data.achieved,
        completed: true,
      },
    });
  }

  getTasks(clientId: string, goalId?: string) {
    const where: { goal: { clientId: string }; goalId?: string } = { goal: { clientId } };
    if (goalId) where.goalId = goalId;
    return this.prismaService.task.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }
}
