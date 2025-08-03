import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { InvitationStatus } from '@repo/db';

import { updateClientStatus, throwAuthError } from '../common/utils/user.utils';

interface SubmissionWhereClause {
  clientId: string;
  formId?: string;
}

@Injectable()
export class ClientService {
  constructor(private readonly prismaService: PrismaService) {}

  async getClientById(clientId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: clientId },
      include: { clients: true },
    });

    if (!user) {
      throwAuthError('Client not found', 'notFound');
    }

    return user;
  }

  async getIntakeFormForClient(clientId: string) {
    // First, check if client has already completed intake
    const existingSubmission = await this.prismaService.intakeFormSubmission.findFirst({
      where: { clientId: clientId },
    });

    if (existingSubmission) {
      throwAuthError('Client has already completed intake form', 'badRequest');
    }

    // Get client's email
    const client = await this.prismaService.user.findUnique({
      where: { id: clientId },
      select: { email: true },
    });

    if (!client) {
      throwAuthError('Client not found', 'notFound');
    }

    // Find the client's invitation with an attached intake form
    const invitation = await this.prismaService.invitation.findFirst({
      where: {
        clientEmail: client.email,
        intakeFormId: { not: null },
      },
      include: {
        intakeForm: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation || !invitation.intakeForm) {
      throwAuthError('No intake form found for this client', 'notFound');
    }

    return {
      id: invitation.intakeForm.id,
      title: invitation.intakeForm.title,
      description: invitation.intakeForm.description,
      questions: invitation.intakeForm.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        isRequired: q.isRequired,
        order: q.order,
      })),
    };
  }

  async submitIntakeForm(clientId: string, formId: string, answers: Record<string, unknown>) {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const existingSubmission = await tx.intakeFormSubmission.findFirst({
            where: {
              clientId: clientId,
              formId: formId,
            },
          });

          if (existingSubmission) {
            throwAuthError('Intake form has already been submitted for this client', 'badRequest');
          }

          const submission = await tx.intakeFormSubmission.create({
            data: {
              clientId: clientId,
              formId: formId,
            },
          });

          const answerPromises = Object.entries(answers).map(([questionId, value]) =>
            tx.answer.create({
              data: {
                submissionId: submission.id,
                questionId,
                value: value as unknown,
              },
            })
          );

          await Promise.all(answerPromises);

          const currentUser = await tx.user.findUnique({ where: { id: clientId } });
          if (currentUser) {
            const newStatus = updateClientStatus(currentUser.clientStatus || 'ACTIVE', true);
            await tx.user.update({
              where: { id: clientId },
              data: { clientStatus: newStatus },
            });

            return { submission, clientStatus: newStatus };
          }

          return { submission, clientStatus: 'INTAKE_COMPLETED' };
        },
        {
          timeout: 30000,
        }
      );

      return {
        success: true,
        submissionId: result.submission.id,
        clientStatus: result.clientStatus,
      };
    } catch (error) {
      if ((error as Error).message.includes('Intake form has already been submitted')) {
        throw error;
      }
      throwAuthError('Failed to submit intake form', 'badRequest');
    }
  }

  async getSubmissionsByClient(clientId: string, formId?: string) {
    const whereClause: SubmissionWhereClause = {
      clientId: clientId,
    };

    if (formId) {
      whereClause.formId = formId;
    }

    return await this.prismaService.intakeFormSubmission.findMany({
      where: whereClause,
      include: {
        form: true,
        answers: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async fixClientStatuses() {
    const users = await this.prismaService.user.findMany({
      where: { role: 'CLIENT' },
      include: { clients: true },
    });

    const updates: string[] = [];
    for (const user of users) {
      // Check if user has any submissions
      const hasSubmissions = await this.prismaService.intakeFormSubmission.findFirst({
        where: { clientId: user.id },
      });

      const currentStatus = user.clientStatus || 'ACTIVE';
      const correctStatus = updateClientStatus(currentStatus, !!hasSubmissions);

      if (currentStatus !== correctStatus) {
        await this.prismaService.user.update({
          where: { id: user.id },
          data: { clientStatus: correctStatus },
        });
        updates.push(user.id);
      }
    }
    return { updated: updates.length };
  }

  // Removed goal-related methods as they don't exist in the schema
}
