import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { IntakeFormService } from './intake-form.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

describe('IntakeFormService', () => {
  let service: IntakeFormService;

  const mockPrismaService = {
    intakeForm: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    question: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const practitionerId = 'practitioner-id';
    const createData: CreateIntakeFormDto = {
      title: 'Health Assessment',
      description: 'Comprehensive health assessment form',
      questions: [
        {
          text: 'What is your age?',
          type: 'SHORT_ANSWER',
          isRequired: true,
          order: 1,
        },
        {
          text: 'Do you have any allergies?',
          type: 'LONG_ANSWER',
          isRequired: false,
          order: 2,
        },
      ],
    };

    const mockCreatedForm = {
      id: 'form-id',
      title: 'Health Assessment',
      description: 'Comprehensive health assessment form',
      practitionerId,
      questions: [
        {
          id: 'question-1',
          text: 'What is your age?',
          type: 'SHORT_ANSWER' as const,
          isRequired: true,
          order: 1,
        },
        {
          id: 'question-2',
          text: 'Do you have any allergies?',
          type: 'LONG_ANSWER' as const,
          isRequired: false,
          order: 2,
        },
      ],
    };

    it('should successfully create an intake form with questions', async () => {
      mockPrismaService.intakeForm.create.mockResolvedValue(mockCreatedForm as never);

      const result = await service.create(practitionerId, createData);

      expect(result).toEqual(mockCreatedForm);
      expect(mockPrismaService.intakeForm.create).toHaveBeenCalledWith({
        data: {
          title: 'Health Assessment',
          description: 'Comprehensive health assessment form',
          practitionerId,
          questions: {
            create: [
              {
                text: 'What is your age?',
                type: 'SHORT_ANSWER',
                options: [],
                isRequired: true,
                order: 1,
              },
              {
                text: 'Do you have any allergies?',
                type: 'LONG_ANSWER',
                options: [],
                isRequired: false,
                order: 2,
              },
            ],
          },
        },
        include: {
          questions: true,
        },
      });
    });

    it('should create form without questions when questions array is empty', async () => {
      const createDataWithoutQuestions = {
        title: 'Simple Form',
        description: 'A simple form without questions',
        questions: [],
      };

      const mockFormWithoutQuestions = {
        id: 'form-id',
        title: 'Simple Form',
        description: 'A simple form without questions',
        practitionerId,
        questions: [],
      };

      mockPrismaService.intakeForm.create.mockResolvedValue(mockFormWithoutQuestions as never);

      const result = await service.create(practitionerId, createDataWithoutQuestions);

      expect(result).toEqual(mockFormWithoutQuestions);
      expect(mockPrismaService.intakeForm.create).toHaveBeenCalledWith({
        data: {
          title: 'Simple Form',
          description: 'A simple form without questions',
          practitionerId,
          questions: {
            create: [],
          },
        },
        include: {
          questions: true,
        },
      });
    });

    it('should handle questions with options', async () => {
      const createDataWithOptions: CreateIntakeFormDto = {
        title: 'Health Assessment',
        description: 'Comprehensive health assessment form',
        questions: [
          {
            text: 'What is your gender?',
            type: 'MULTIPLE_CHOICE',
            options: ['Male', 'Female', 'Other'],
            isRequired: true,
            order: 1,
          },
        ],
      };

      mockPrismaService.intakeForm.create.mockResolvedValue(mockCreatedForm as never);

      await service.create(practitionerId, createDataWithOptions);

      expect(mockPrismaService.intakeForm.create).toHaveBeenCalledWith({
        data: {
          title: 'Health Assessment',
          description: 'Comprehensive health assessment form',
          practitionerId,
          questions: {
            create: [
              {
                text: 'What is your gender?',
                type: 'MULTIPLE_CHOICE',
                options: ['Male', 'Female', 'Other'],
                isRequired: true,
                order: 1,
              },
            ],
          },
        },
        include: {
          questions: true,
        },
      });
    });
  });

  describe('update', () => {
    const formId = 'form-id';
    const practitionerId = 'practitioner-id';
    const updateData: CreateIntakeFormDto = {
      title: 'Updated Health Assessment',
      description: 'Updated comprehensive health assessment form',
      questions: [
        {
          text: 'What is your updated age?',
          type: 'SHORT_ANSWER',
          isRequired: true,
          order: 1,
        },
      ],
    };

    const mockExistingForm = {
      id: formId,
      title: 'Health Assessment',
      description: 'Comprehensive health assessment form',
      practitionerId,
    };

    const mockUpdatedForm = {
      id: formId,
      title: 'Updated Health Assessment',
      description: 'Updated comprehensive health assessment form',
      practitionerId,
      questions: [
        {
          id: 'question-1',
          text: 'What is your updated age?',
          type: 'SHORT_ANSWER',
          isRequired: true,
          order: 1,
        },
      ],
    };

    it('should successfully update an intake form', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(mockExistingForm as never);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        const tx = {
          intakeForm: {
            update: jest.fn().mockResolvedValue(mockUpdatedForm),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedForm),
          },
          question: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await service.update(formId, practitionerId, updateData);

      expect(result).toEqual(mockUpdatedForm);
      expect(mockPrismaService.intakeForm.findUnique).toHaveBeenCalledWith({
        where: { id: formId },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(null);

      await expect(service.update(formId, practitionerId, updateData)).rejects.toThrow(
        new NotFoundException('Intake form not found.')
      );
    });

    it('should throw ForbiddenException when form does not belong to practitioner', async () => {
      const wrongForm = {
        ...mockExistingForm,
        practitionerId: 'different-practitioner-id',
      };

      mockPrismaService.intakeForm.findUnique.mockResolvedValue(wrongForm as never);

      await expect(service.update(formId, practitionerId, updateData)).rejects.toThrow(
        new ForbiddenException('You do not have permission to update this form.')
      );
    });

    it('should delete existing questions and create new ones in transaction', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(mockExistingForm as never);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        const tx = {
          intakeForm: {
            update: jest.fn().mockResolvedValue(mockUpdatedForm),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedForm),
          },
          question: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(tx);
      });

      await service.update(formId, practitionerId, updateData);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const formId = 'form-id';
    const practitionerId = 'practitioner-id';

    const mockForm = {
      id: formId,
      title: 'Health Assessment',
      description: 'Comprehensive health assessment form',
      practitionerId,
    };

    it('should successfully delete an intake form', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(mockForm as never);
      mockPrismaService.intakeForm.delete.mockResolvedValue(mockForm as never);

      const result = await service.delete(formId, practitionerId);

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.intakeForm.delete).toHaveBeenCalledWith({
        where: { id: formId },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(null);

      await expect(service.delete(formId, practitionerId)).rejects.toThrow(
        new NotFoundException('Intake form not found.')
      );
    });

    it('should throw ForbiddenException when form does not belong to practitioner', async () => {
      const wrongForm = {
        ...mockForm,
        practitionerId: 'different-practitioner-id',
      };

      mockPrismaService.intakeForm.findUnique.mockResolvedValue(wrongForm as never);

      await expect(service.delete(formId, practitionerId)).rejects.toThrow(
        new ForbiddenException('You do not have permission to delete this form.')
      );
    });
  });

  describe('findAllForPractitioner', () => {
    const practitionerId = 'practitioner-id';

    const mockForms = [
      {
        id: 'form-1',
        title: 'Health Assessment',
        description: 'Comprehensive health assessment form',
        practitionerId,
        updatedAt: new Date('2024-01-02'),
        _count: { questions: 5 },
      },
      {
        id: 'form-2',
        title: 'Mental Health Assessment',
        description: 'Mental health evaluation form',
        practitionerId,
        updatedAt: new Date('2024-01-01'),
        _count: { questions: 3 },
      },
    ];

    it('should return all forms for practitioner ordered by updatedAt desc', async () => {
      mockPrismaService.intakeForm.findMany.mockResolvedValue(mockForms as never);

      const result = await service.findAllForPractitioner(practitionerId);

      expect(result).toEqual(mockForms);
      expect(mockPrismaService.intakeForm.findMany).toHaveBeenCalledWith({
        where: { practitionerId },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    const formId = 'form-id';
    const practitionerId = 'practitioner-id';

    const mockForm = {
      id: formId,
      title: 'Health Assessment',
      description: 'Comprehensive health assessment form',
      practitionerId,
      questions: [
        {
          id: 'question-1',
          text: 'What is your age?',
          type: 'SHORT_ANSWER',
          isRequired: true,
          order: 1,
        },
        {
          id: 'question-2',
          text: 'Do you have any allergies?',
          type: 'LONG_ANSWER',
          isRequired: false,
          order: 2,
        },
      ],
    };

    it('should return form with questions ordered by order', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(mockForm as never);

      const result = await service.findOne(formId, practitionerId);

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.intakeForm.findUnique).toHaveBeenCalledWith({
        where: { id: formId },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(null);

      await expect(service.findOne(formId, practitionerId)).rejects.toThrow(
        new NotFoundException('Intake form not found.')
      );
    });

    it('should throw ForbiddenException when form does not belong to practitioner', async () => {
      const wrongForm = {
        ...mockForm,
        practitionerId: 'different-practitioner-id',
      };

      mockPrismaService.intakeForm.findUnique.mockResolvedValue(wrongForm as never);

      await expect(service.findOne(formId, practitionerId)).rejects.toThrow(
        new ForbiddenException('You do not have permission to view this form.')
      );
    });
  });
});
