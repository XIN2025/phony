import { z } from 'zod';

export enum QuestionType {
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOX = 'CHECKBOX',
  SELECT = 'SELECT',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DATE = 'DATE',
  TIME = 'TIME',
  URL = 'URL',
  FILE_UPLOAD = 'FILE_UPLOAD',
}

export const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

export const questionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(QuestionType),
  title: z.string().min(1, 'Question title is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(questionOptionSchema).optional(),
  placeholder: z.string().optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export const intakeFormSchema = z.object({
  title: z.string().min(1, 'Form title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

export type Question = z.infer<typeof questionSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type IntakeFormData = z.infer<typeof intakeFormSchema>;
export type CreateIntakeFormDto = IntakeFormData;
