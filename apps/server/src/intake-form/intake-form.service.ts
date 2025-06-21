import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

@Injectable()
export class IntakeFormService {
  constructor(private readonly prisma: PrismaService) {}

  async create(practitionerId: string, data: CreateIntakeFormDto) {
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
            options: q.options || [],
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

    // First, verify the form exists and belongs to the practitioner
    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found.');
    }

    if (form.practitionerId !== practitionerId) {
      throw new ForbiddenException('You do not have permission to update this form.');
    }

    // Now, update the form in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Update the simple fields
      await tx.intakeForm.update({
        where: { id: formId },
        data: {
          title,
          description,
        },
      });

      // 2. Delete all existing questions for this form
      await tx.question.deleteMany({
        where: { formId },
      });

      // 3. Create the new questions
      if (questions?.length) {
        await tx.question.createMany({
          data: questions.map((q) => ({
            formId,
            text: q.text,
            type: q.type,
            options: q.options || [],
            isRequired: q.isRequired,
            order: q.order,
          })),
        });
      }

      // Return the updated form with questions
      return tx.intakeForm.findUnique({
        where: { id: formId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async delete(formId: string, practitionerId: string) {
    // First, verify the form exists and belongs to the practitioner
    const form = await this.prisma.intakeForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException('Intake form not found.');
    }

    if (form.practitionerId !== practitionerId) {
      throw new ForbiddenException('You do not have permission to delete this form.');
    }

    // Deleting the form will cascade and delete the questions
    return this.prisma.intakeForm.delete({
      where: { id: formId },
    });
  }

  async findAllForPractitioner(practitionerId: string) {
    return this.prisma.intakeForm.findMany({
      where: { practitionerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
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
      throw new NotFoundException('Intake form not found.');
    }

    if (form.practitionerId !== practitionerId) {
      throw new ForbiddenException('You do not have permission to view this form.');
    }

    return form;
  }
}
