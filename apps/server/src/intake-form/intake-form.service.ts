import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { throwAuthError } from 'src/common/utils/user.utils';

@Injectable()
export class IntakeFormService {
  constructor(private readonly prisma: PrismaService) {}

  create(practitionerId: string, data: CreateIntakeFormDto) {
    const { title, description, questions } = data;

    return this.prisma.intakeForm.create({
      data: {
        title,
        description,
        practitionerId,
        questions: {
          create: questions?.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options?.map((opt) => opt.text) || [],
            isRequired: q.isRequired,
            order: q.order,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
  }

  async update(formId: string, practitionerId: string, data: CreateIntakeFormDto) {
    const { title, description, questions } = data;

    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throwAuthError('Intake form not found.', 'notFound');
    }

    if (form.practitionerId !== practitionerId) {
      throwAuthError('You do not have permission to update this form.', 'unauthorized');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.intakeForm.update({
        where: { id: formId },
        data: {
          title,
          description,
        },
      });

      await tx.question.deleteMany({
        where: { formId },
      });

      if (questions?.length) {
        await tx.question.createMany({
          data: questions.map((q) => ({
            formId,
            text: q.text,
            type: q.type,
            options: q.options?.map((opt) => opt.text) || [],
            isRequired: q.isRequired,
            order: q.order,
          })),
        });
      }

      return tx.intakeForm.findUnique({
        where: { id: formId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async delete(formId: string, practitionerId: string) {
    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throwAuthError('Intake form not found.', 'notFound');
    }

    if (form.practitionerId !== practitionerId) {
      throwAuthError('You do not have permission to delete this form.', 'unauthorized');
    }

    return this.prisma.intakeForm.delete({
      where: { id: formId },
    });
  }

  async findAllForPractitioner(practitionerId: string) {
    const forms = await this.prisma.intakeForm.findMany({
      where: { practitionerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return forms.map((form) => ({
      ...form,
      questions: form.questions.map((q) => ({
        ...q,
        options: q.options.map((opt) => ({ text: opt })),
      })),
    }));
  }

  async findOne(formId: string, practitionerId: string) {
    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      throwAuthError('Intake form not found.', 'notFound');
    }

    if (form.practitionerId !== practitionerId) {
      throwAuthError('You do not have permission to view this form.', 'unauthorized');
    }

    const mappedQuestions = form.questions.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ text: opt })),
    }));

    return { ...form, questions: mappedQuestions };
  }
}
