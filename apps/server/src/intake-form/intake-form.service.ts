import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionType as SharedQuestionType } from '@repo/shared-types';
import { QuestionType as PrismaQuestionType } from '@repo/db';

interface CreateIntakeFormData {
  title: string;
  description?: string;
  questions: QuestionData[];
}

interface QuestionData {
  title: string;
  id: string;
  type: SharedQuestionType;
  required: boolean;
  description?: string;
  options?: { id: string; value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  placeholder?: string;
}

interface AnswerData {
  questionId: string;
  value: string;
}

function mapQuestionType(type: SharedQuestionType): (typeof PrismaQuestionType)[keyof typeof PrismaQuestionType] {
  return type as (typeof PrismaQuestionType)[keyof typeof PrismaQuestionType];
}

@Injectable()
export class IntakeFormService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntakeForm(practitionerId: string, data: CreateIntakeFormData) {
    const form = await this.prisma.intakeForm.create({
      data: {
        title: data.title,
        description: data.description,
        practitionerId,
        questions: {
          create: data.questions.map((q: QuestionData, index: number) => {
            const mappedOptions = q.options
              ? q.options.map((opt) => {
                  return opt.value || opt.label || '';
                })
              : [];

            return {
              text: q.title,
              type: mapQuestionType(q.type),
              isRequired: q.required,
              order: index,
              options: mappedOptions,
            };
          }),
        },
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return form;
  }

  async getIntakeFormsByPractitioner(practitionerId: string) {
    return await this.prisma.intakeForm.findMany({
      where: { practitionerId },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateIntakeForm(formId: string, practitionerId: string, data: CreateIntakeFormData) {
    const existingForm = await this.prisma.intakeForm.findFirst({
      where: { id: formId, practitionerId },
    });

    if (!existingForm) {
      throw new NotFoundException('Intake form not found');
    }

    await this.prisma.intakeForm.update({
      where: { id: formId },
      data: {
        questions: {
          deleteMany: {},
        },
      },
    });

    const updatedForm = await this.prisma.intakeForm.update({
      where: { id: formId },
      data: {
        title: data.title,
        description: data.description,
        questions: {
          create: data.questions.map((q: QuestionData, index: number) => ({
            text: q.title,
            type: mapQuestionType(q.type),
            isRequired: q.required,
            order: index,
            options: q.options ? q.options.map((opt) => opt.value || opt.label || '') : [],
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return updatedForm;
  }

  async deleteIntakeForm(formId: string, practitionerId: string) {
    const form = await this.prisma.intakeForm.findFirst({
      where: { id: formId, practitionerId },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found');
    }

    await this.prisma.intakeForm.delete({
      where: { id: formId },
    });

    return { success: true };
  }

  async getIntakeFormById(formId: string) {
    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found');
    }

    return form;
  }

  async submitIntakeForm(clientId: string, formId: string, answers: AnswerData[]) {
    const submission = await this.prisma.$transaction(async (tx) => {
      const newSubmission = await tx.intakeFormSubmission.create({
        data: {
          clientId,
          formId,
        },
      });

      for (const answer of answers) {
        await tx.answer.create({
          data: {
            submissionId: newSubmission.id,
            questionId: answer.questionId,
            value: answer.value,
          },
        });
      }

      return newSubmission;
    });

    return submission;
  }

  async getFormSubmissions(formId: string, practitionerId: string) {
    const form = await this.prisma.intakeForm.findFirst({
      where: { id: formId, practitionerId },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found');
    }

    return await this.prisma.intakeFormSubmission.findMany({
      where: { formId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answers: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }
}
