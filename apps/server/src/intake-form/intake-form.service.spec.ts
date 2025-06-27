import { Test, TestingModule } from '@nestjs/testing';
import { IntakeFormService } from './intake-form.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionType } from '@repo/shared-types/schemas';

describe('IntakeFormService', () => {
  let service: IntakeFormService;

  const mockPrismaService = {
    intakeForm: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntakeFormService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IntakeFormService>(IntakeFormService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntakeForm', () => {
    it('should create a new intake form with questions', async () => {
      const practitionerId = 'practitioner123';
      const createData = {
        title: 'Test Form',
        description: 'Test Description',
        questions: [
          {
            id: 'q1',
            title: 'What is your name?',
            type: QuestionType.SHORT_TEXT,
            required: true,
          },
          {
            id: 'q2',
            title: 'Tell us about yourself',
            type: QuestionType.LONG_TEXT,
            required: false,
          },
        ],
      };

      const mockCreatedForm = {
        id: 'form123',
        title: 'Test Form',
        description: 'Test Description',
        practitionerId,
        questions: [
          {
            id: 'question1',
            text: 'What is your name?',
            type: 'SHORT_ANSWER',
            isRequired: true,
            order: 0,
            options: [],
          },
          {
            id: 'question2',
            text: 'Tell us about yourself',
            type: 'LONG_ANSWER',
            isRequired: false,
            order: 1,
            options: [],
          },
        ],
      };

      mockPrismaService.intakeForm.create.mockResolvedValue(mockCreatedForm as never);

      const result = await service.createIntakeForm(practitionerId, createData);

      expect(result).toEqual(mockCreatedForm);
      expect(mockPrismaService.intakeForm.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Form',
          description: 'Test Description',
          practitionerId,
          questions: {
            create: [
              {
                text: 'What is your name?',
                type: 'SHORT_ANSWER',
                isRequired: true,
                order: 0,
                options: [],
              },
              {
                text: 'Tell us about yourself',
                type: 'LONG_ANSWER',
                isRequired: false,
                order: 1,
                options: [],
              },
            ],
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
    });
  });

  describe('getIntakeFormsByPractitioner', () => {
    it('should return intake forms for a practitioner', async () => {
      const practitionerId = 'practitioner123';
      const mockForms = [
        {
          id: 'form1',
          title: 'Form 1',
          questions: [],
          _count: { questions: 2, submissions: 5 },
        },
      ];

      mockPrismaService.intakeForm.findMany.mockResolvedValue(mockForms as never);

      const result = await service.getIntakeFormsByPractitioner(practitionerId);

      expect(result).toEqual(mockForms);
      expect(mockPrismaService.intakeForm.findMany).toHaveBeenCalledWith({
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
    });
  });
});
