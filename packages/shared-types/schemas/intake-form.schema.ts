import { z } from 'zod';

// Replicating the enum from schema.prisma to avoid a direct dependency
// on the @repo/db package, which simplifies the dependency tree.
export const questionTypeEnum = z.enum(['SHORT_ANSWER', 'LONG_ANSWER', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'SCALE']);

export const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question text cannot be empty'),
  type: questionTypeEnum,
  options: z.array(z.string()).optional(),
  isRequired: z.boolean(),
  order: z.number().int(),
});

export const intakeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema),
});

export type CreateIntakeFormDto = z.infer<typeof intakeFormSchema>;
export type CreateQuestionDto = z.infer<typeof questionSchema>;
