import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { QuestionType } from '@repo/db';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('seed-templates')
  @Public()
  async seedTemplates() {
    // Find or create a default practitioner
    let defaultPractitioner = await this.prisma.user.findFirst({
      where: { role: 'PRACTITIONER' },
    });

    if (!defaultPractitioner) {
      defaultPractitioner = await this.prisma.user.create({
        data: {
          email: 'default-practitioner@example.com',
          firstName: 'Default',
          lastName: 'Practitioner',
          role: 'PRACTITIONER',
          isEmailVerified: true,
        },
      });
    }

    const templates = [
      {
        title: 'Life Coach Intake Form',
        description:
          "Welcome! This form helps your coach understand where you are now and where you'd like to go. Please answer honestly — there are no right or wrong answers.",
        questions: [
          { text: 'Name:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 0, options: [] },
          { text: 'Age:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 1, options: [] },
          { text: 'Occupation:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 2, options: [] },
          { text: 'Location/Time Zone:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 3, options: [] },
          {
            text: 'What areas of your life would you like to focus on right now? (tick all that apply)',
            type: QuestionType.CHECKBOXES,
            isRequired: true,
            order: 4,
            options: [
              'Career',
              'Health & Wellness',
              'Relationships',
              'Confidence / Mindset',
              'Motivation / Productivity',
              'Life Transitions',
              'Other',
            ],
          },
          {
            text: 'If you could achieve just one outcome from coaching, what would it be?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 5,
            options: [],
          },
          {
            text: 'How satisfied are you with your life right now in general? (1 = not at all, 10 = very satisfied)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 6,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'Briefly describe what a "good week" looks like for you. E.g., what habits, routines, or outcomes make you feel good?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 7,
            options: [],
          },
          {
            text: "Are there any recurring challenges or blocks you're facing? E.g., procrastination, overwhelm, lack of direction",
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 8,
            options: [],
          },
          {
            text: 'What habits or routines are you currently trying to build or maintain? List 2–3 if any:',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 9,
            options: [],
          },
          {
            text: 'Do you prefer structured tasks or more open-ended goals between sessions?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 10,
            options: [
              'Structured (checklists, daily habits, etc.)',
              'Open-ended (journaling prompts, reflection, etc.)',
              'Mix of both',
              'Not sure yet',
            ],
          },
          {
            text: "How do you typically handle setbacks or when things don't go as planned?",
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 11,
            options: [],
          },
          {
            text: 'What support systems do you have in place? (e.g., family, friends, other professionals)',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 12,
            options: [],
          },
          {
            text: "Is there anything else you'd like your coach to know about you or your situation?",
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 13,
            options: [],
          },
        ],
      },
      {
        title: 'Wellness Coaching Intake Form',
        description:
          'Welcome to your wellness journey! This form helps us understand your current health status and wellness goals. Your responses will help create a personalized approach.',
        questions: [
          { text: 'Name:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 0, options: [] },
          { text: 'Age:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 1, options: [] },
          {
            text: 'Current weight (if comfortable sharing):',
            type: QuestionType.SHORT_ANSWER,
            isRequired: false,
            order: 2,
            options: [],
          },
          { text: 'Height:', type: QuestionType.SHORT_ANSWER, isRequired: false, order: 3, options: [] },
          {
            text: 'What are your primary wellness goals? (select all that apply)',
            type: QuestionType.CHECKBOXES,
            isRequired: true,
            order: 4,
            options: [
              'Weight loss',
              'Muscle gain',
              'Better sleep',
              'Stress management',
              'Increased energy',
              'Better nutrition',
              'Improved fitness',
              'Mental health',
              'Other',
            ],
          },
          {
            text: 'How would you rate your current energy levels? (1 = very low, 10 = very high)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 5,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'How many hours of sleep do you typically get per night?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 6,
            options: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', '8-9 hours', 'More than 9 hours'],
          },
          {
            text: 'How would you describe your current eating habits?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 7,
            options: [],
          },
          {
            text: 'What is your current exercise routine? (if any)',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 8,
            options: [],
          },
          {
            text: 'Do you have any medical conditions or take any medications?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 9,
            options: [],
          },
          {
            text: 'What is your biggest challenge when it comes to maintaining a healthy lifestyle?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 10,
            options: [],
          },
          {
            text: 'What motivates you to make healthy changes?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 11,
            options: [],
          },
          {
            text: 'What would success look like for you in 3 months?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 12,
            options: [],
          },
        ],
      },
      {
        title: 'Counselling Intake Form',
        description:
          'Welcome! This form helps us understand your current situation and how we can best support you. Please answer as honestly as possible.',
        questions: [
          { text: 'Name:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 0, options: [] },
          { text: 'Age:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 1, options: [] },
          {
            text: 'Emergency contact name and phone number:',
            type: QuestionType.SHORT_ANSWER,
            isRequired: true,
            order: 2,
            options: [],
          },
          {
            text: 'What brings you to counselling at this time?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 3,
            options: [],
          },
          {
            text: 'How long have you been experiencing these concerns?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 4,
            options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year'],
          },
          {
            text: 'How would you rate your current mood? (1 = very low, 10 = very good)',
            type: QuestionType.SCALE,
            isRequired: true,
            order: 5,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
          {
            text: 'Have you received counselling or therapy before?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 6,
            options: ['Yes, currently', 'Yes, in the past', 'No, this is my first time'],
          },
          {
            text: 'Are you currently taking any medications for mental health?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 7,
            options: ['Yes', 'No', 'Prefer not to say'],
          },
          {
            text: 'Do you have any thoughts of harming yourself or others?',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 8,
            options: ['Yes', 'No', 'Sometimes', 'Prefer not to say'],
          },
          {
            text: 'What coping strategies have you found helpful in the past?',
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 9,
            options: [],
          },
          {
            text: 'What would you like to achieve through counselling?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 10,
            options: [],
          },
          {
            text: "Is there anything else you'd like me to know about your situation?",
            type: QuestionType.LONG_ANSWER,
            isRequired: false,
            order: 11,
            options: [],
          },
        ],
      },
      {
        title: 'Psychologist/Psychotherapist Intake Form',
        description:
          'Welcome! This comprehensive form helps us understand your mental health history and current needs. All information is confidential.',
        questions: [
          { text: 'Name:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 0, options: [] },
          { text: 'Date of birth:', type: QuestionType.SHORT_ANSWER, isRequired: true, order: 1, options: [] },
          {
            text: 'Emergency contact name and phone number:',
            type: QuestionType.SHORT_ANSWER,
            isRequired: true,
            order: 2,
            options: [],
          },
          {
            text: 'What are your primary concerns or reasons for seeking therapy?',
            type: QuestionType.LONG_ANSWER,
            isRequired: true,
            order: 3,
            options: [],
          },
          {
            text: 'When did these concerns first begin?',
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
