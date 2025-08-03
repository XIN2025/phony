import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionType } from '@repo/db';

@Injectable()
export class IntakeFormSeederService {
  constructor(private readonly prisma: PrismaService) {}

  async seedTemplates() {
    // Get or create default practitioner for templates
    let defaultPractitioner = await this.prisma.user.findFirst({
      where: { role: 'PRACTITIONER' },
    });

    if (!defaultPractitioner) {
      defaultPractitioner = await this.prisma.user.create({
        data: {
          email: 'admin@continuum.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'PRACTITIONER',
          profession: 'Administrator',
        },
      });
    }

    const templates = [
      {
        title: 'Life Coach Intake Form Template',
        description: 'Comprehensive intake form for life coaching sessions',
        questions: [
          {
            text: 'What brings you to life coaching?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 1,
            options: [],
          },
          {
            text: 'What areas of your life would you like to improve?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 2,
            options: [
              'Career',
              'Relationships',
              'Health & Wellness',
              'Personal Growth',
              'Financial',
              'All of the above',
            ],
          },
          {
            text: 'What are your biggest challenges right now?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 3,
            options: [],
          },
          {
            text: 'What are your main goals for the next 3-6 months?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 4,
            options: [],
          },
          {
            text: 'How do you typically handle stress and difficult situations?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 5,
            options: [],
          },
          {
            text: 'What motivates you to make positive changes?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 6,
            options: [],
          },
        ],
      },
      {
        title: 'Wellness Coaching Intake Form Template',
        description: 'Holistic wellness assessment for coaching sessions',
        questions: [
          {
            text: 'What aspects of wellness are you looking to improve?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 1,
            options: [
              'Physical Health',
              'Mental Health',
              'Nutrition',
              'Sleep',
              'Stress Management',
              'Work-Life Balance',
            ],
          },
          {
            text: 'How would you rate your current energy levels? (1-10)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 2,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'Describe your current daily routine',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 3,
            options: [],
          },
          {
            text: 'What are your biggest wellness challenges?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 4,
            options: [],
          },
          {
            text: 'What healthy habits do you already have?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 5,
            options: [],
          },
          {
            text: 'What is your ideal vision of wellness?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 6,
            options: [],
          },
        ],
      },
      {
        title: 'Counselling Intake Form Template',
        description: 'Standard counselling intake assessment',
        questions: [
          {
            text: 'What brings you to counselling today?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 1,
            options: [],
          },
          {
            text: 'How long have you been experiencing these concerns?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 2,
            options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'Over 1 year'],
          },
          {
            text: 'Have you received counselling before?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 3,
            options: ['Yes, currently', 'Yes, in the past', 'No', 'Prefer not to say'],
          },
          {
            text: 'What are your main symptoms or concerns?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 4,
            options: [],
          },
          {
            text: 'How have these concerns affected your daily life?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 5,
            options: [],
          },
          {
            text: 'Have you experienced any recent major life changes or stressors?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 6,
            options: [],
          },
          {
            text: 'Do you have a history of mental health treatment?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 7,
            options: ['Yes, currently in treatment', 'Yes, in the past', 'No', 'Prefer not to say'],
          },
          {
            text: 'Are you currently taking any psychiatric medications?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 8,
            options: ['Yes', 'No', 'Prefer not to say'],
          },
          {
            text: 'Do you have any family history of mental health conditions?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 9,
            options: [],
          },
          {
            text: 'How would you rate your current level of distress? (1 = minimal, 10 = severe)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 10,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'What are your goals for therapy?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 11,
            options: [],
          },
          {
            text: "Is there anything else you'd like me to know?",
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 12,
            options: [],
          },
        ],
      },
      {
        title: 'Psychologist/Psychotherapist Intake Form Template',
        description: 'Comprehensive psychological assessment form',
        questions: [
          {
            text: 'What brings you to therapy?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 1,
            options: [],
          },
          {
            text: 'How long have you been experiencing these concerns?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 2,
            options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'Over 1 year'],
          },
          {
            text: 'Have you received psychological treatment before?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 3,
            options: ['Yes, currently', 'Yes, in the past', 'No', 'Prefer not to say'],
          },
          {
            text: 'What are your main symptoms or concerns?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 4,
            options: [],
          },
          {
            text: 'How have these concerns affected your daily life?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 5,
            options: [],
          },
          {
            text: 'Have you experienced any recent major life changes or stressors?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 6,
            options: [],
          },
          {
            text: 'Do you have a history of mental health treatment?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 7,
            options: ['Yes, currently in treatment', 'Yes, in the past', 'No', 'Prefer not to say'],
          },
          {
            text: 'Are you currently taking any psychiatric medications?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 8,
            options: ['Yes', 'No', 'Prefer not to say'],
          },
          {
            text: 'Do you have any family history of mental health conditions?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 9,
            options: [],
          },
          {
            text: 'How would you rate your current level of distress? (1 = minimal, 10 = severe)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 10,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'What are your goals for therapy?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 11,
            options: [],
          },
          {
            text: "Is there anything else you'd like me to know?",
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 12,
            options: [],
          },
        ],
      },
    ];

    for (const template of templates) {
      // Check if template form already exists
      const existingForm = await this.prisma.intakeForm.findFirst({
        where: {
          title: template.title,
          isTemplate: true,
        },
      });

      if (!existingForm) {
        await this.prisma.intakeForm.create({
          data: {
            title: template.title,
            description: template.description,
            practitionerId: defaultPractitioner.id,
            isTemplate: true,
            questions: {
              create: template.questions.map((q) => ({
                text: q.text,
                type: q.type,
                isRequired: q.isRequired,
                order: q.order,
                options: q.options,
              })),
            },
          },
        });
        console.log(`Created template form: ${template.title}`);
      } else {
        console.log(`Template form already exists: ${template.title}`);
      }
    }

    return { message: 'Templates seeded successfully' };
  }
}
