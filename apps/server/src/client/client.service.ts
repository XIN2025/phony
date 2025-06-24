import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db';

@Injectable()
export class ClientService {
  constructor(private readonly prismaService: PrismaService) {}

  async getIntakeForm(clientId: string) {
    const client = await this.prismaService.user.findUnique({
      where: { id: clientId },
    });

    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client not found');
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
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('No invitation found for this client');
    }

    if (!invitation.intakeForm) {
      throw new NotFoundException('No intake form attached to this invitation');
    }

    const existingSubmission = await this.prismaService.intakeFormSubmission.findFirst({
      where: {
        clientId: clientId,
        formId: invitation.intakeForm.id,
      },
    });

    if (existingSubmission) {
      if (client.clientStatus !== 'INTAKE_COMPLETED') {
        await this.prismaService.user.update({
          where: { id: clientId },
          data: {
            clientStatus: 'INTAKE_COMPLETED',
          },
        });
      }
      throw new BadRequestException('Client has already completed intake');
    }

    if (client.clientStatus === 'INTAKE_COMPLETED') {
      await this.prismaService.user.update({
        where: { id: clientId },
        data: {
          clientStatus: 'NEEDS_INTAKE',
        },
      });
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
    const client = await this.prismaService.user.findUnique({
      where: { id: clientId },
    });

    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client not found');
    }

    const form = await this.prismaService.intakeForm.findFirst({
      where: {
        id: formId,
        practitionerId: client.practitionerId || undefined,
      },
      include: {
        questions: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found');
    }

    const existingSubmission = await this.prismaService.intakeFormSubmission.findFirst({
      where: {
        clientId: clientId,
        formId: formId,
      },
    });

    if (existingSubmission) {
      if (client.clientStatus !== 'INTAKE_COMPLETED') {
        await this.prismaService.user.update({
          where: { id: clientId },
          data: {
            clientStatus: 'INTAKE_COMPLETED',
          },
        });
      }
      throw new BadRequestException('You have already submitted this intake form');
    }

    if (client.clientStatus !== 'NEEDS_INTAKE') {
      if (client.clientStatus === 'INTAKE_COMPLETED') {
        await this.prismaService.user.update({
          where: { id: clientId },
          data: {
            clientStatus: 'NEEDS_INTAKE',
          },
        });
      } else {
        throw new BadRequestException('Client is not in the correct status to submit intake form');
      }
    }

    const submission = await this.prismaService.intakeFormSubmission.create({
      data: {
        clientId: clientId,
        formId: formId,
      },
    });

    const answerPromises = form.questions
      .map((question) => {
        const answer = answers[question.id];
        if (answer !== undefined) {
          return this.prismaService.answer.create({
            data: {
              submissionId: submission.id,
              questionId: question.id,
              value: JSON.stringify(answer),
            },
          });
        }
        return null;
      })
      .filter(Boolean);

    await Promise.all(answerPromises);

    await this.prismaService.user.update({
      where: { id: clientId },
      data: {
        clientStatus: 'INTAKE_COMPLETED',
      },
    });

    return {
      message: 'Intake form submitted successfully',
      clientStatus: 'INTAKE_COMPLETED',
      submissionId: submission.id,
    };
  }

  async fixClientStatuses() {
    const clientsWithCompletedStatus = await this.prismaService.user.findMany({
      where: {
        role: UserRole.CLIENT,
        clientStatus: 'INTAKE_COMPLETED',
      },
    });

    let fixedCount = 0;

    for (const client of clientsWithCompletedStatus) {
      const submission = await this.prismaService.intakeFormSubmission.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!submission) {
        await this.prismaService.user.update({
          where: { id: client.id },
          data: {
            clientStatus: 'NEEDS_INTAKE',
          },
        });
        fixedCount++;
      }
    }

    return {
      message: `Fixed ${fixedCount} client statuses`,
      fixedCount,
    };
  }
}
