import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PractitionerService, InviteClientDto } from './practitioner.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@repo/db';

describe('PractitionerService', () => {
  let service: PractitionerService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    invitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    intakeForm: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockMailService = {
    sendClientInvitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PractitionerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<PractitionerService>(PractitionerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('inviteClient', () => {
    const practitionerId = 'practitioner-id';
    const inviteData: InviteClientDto = {
      clientFirstName: 'John',
      clientLastName: 'Doe',
      clientEmail: 'john.doe@example.com',
    };

    const mockPractitioner = {
      id: practitionerId,
      name: 'Dr. Smith',
      email: 'dr.smith@example.com',
      role: UserRole.PRACTITIONER,
    };

    const mockInvitation = {
      id: 'invitation-id',
      practitionerId,
      clientEmail: 'john.doe@example.com',
      clientFirstName: 'John',
      clientLastName: 'Doe',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAccepted: false,
      createdAt: new Date(),
    };

    it('should successfully invite a client', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);

      const result = await service.inviteClient(practitionerId, inviteData);

      expect(result).toEqual({
        id: 'invitation-id',
        clientEmail: 'john.doe@example.com',
        clientFirstName: 'John',
        clientLastName: 'Doe',
        status: 'PENDING',
        invited: expect.any(String),
        createdAt: mockInvitation.createdAt,
        avatar: expect.any(String),
      });
      expect(mockPrismaService.invitation.create).toHaveBeenCalled();
      expect(mockMailService.sendClientInvitation).toHaveBeenCalled();
    });

    it('should handle email normalization', async () => {
      const inviteDataWithSpaces = {
        ...inviteData,
        clientEmail: '  JOHN.DOE@EXAMPLE.COM  ',
        clientFirstName: '  John  ',
        clientLastName: '  Doe  ',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);

      await service.inviteClient(practitionerId, inviteDataWithSpaces);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
      });
    });

    it('should throw NotFoundException when practitioner not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.inviteClient(practitionerId, inviteData)).rejects.toThrow(
        'Not Found: Practitioner not found'
      );
    });

    it('should throw BadRequestException when client already exists', async () => {
      const existingClient = {
        id: 'client-id',
        email: 'john.doe@example.com',
        practitionerId,
        role: UserRole.CLIENT,
      };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(existingClient as never); // Second call for existing user
      await expect(service.inviteClient(practitionerId, inviteData)).rejects.toThrow(
        'Bad Request: A user with this email already exists'
      );
    });

    it('should update and return invitation when invitation already exists and is still valid', async () => {
      const existingInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        isAccepted: false,
        token: 'existing-token',
        clientFirstName: 'John',
        clientLastName: 'Doe',
        createdAt: new Date(),
      };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(existingInvitation as never);
      mockPrismaService.invitation.update.mockResolvedValue(existingInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);
      const result = await service.inviteClient(practitionerId, inviteData);
      expect(result).toEqual({
        id: existingInvitation.id,
        clientEmail: existingInvitation.clientEmail,
        clientFirstName: existingInvitation.clientFirstName,
        clientLastName: existingInvitation.clientLastName,
        status: 'PENDING',
        invited: expect.any(String),
        createdAt: existingInvitation.createdAt,
        avatar: expect.any(String),
      });
    });

    it('should delete expired invitation and create new one', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isAccepted: false,
      };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(expiredInvitation as never);
      mockPrismaService.invitation.update.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);
      await service.inviteClient(practitionerId, inviteData);
      expect(mockPrismaService.invitation.update).toHaveBeenCalled();
    });

    it('should validate intake form if provided', async () => {
      const inviteDataWithForm = {
        ...inviteData,
        intakeFormId: 'form-id',
      };
      const mockForm = {
        id: 'form-id',
        title: 'Health Assessment',
        practitionerId,
      };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(mockForm as never);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);
      await service.inviteClient(practitionerId, inviteDataWithForm);
      expect(mockPrismaService.intakeForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-id' },
        select: { title: true },
      });
    });

    it('should create and return invitation when intake form not found or does not belong to practitioner', async () => {
      const inviteDataWithForm = {
        ...inviteData,
        intakeFormId: 'form-id',
      };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.intakeForm.findUnique.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(true);
      const result = await service.inviteClient(practitionerId, inviteDataWithForm);
      expect(result).toEqual({
        id: mockInvitation.id,
        clientEmail: mockInvitation.clientEmail,
        clientFirstName: mockInvitation.clientFirstName,
        clientLastName: mockInvitation.clientLastName,
        status: 'PENDING',
        invited: expect.any(String),
        createdAt: mockInvitation.createdAt,
        avatar: expect.any(String),
      });
    });

    it('should throw BadRequestException when email sending fails', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockResolvedValue(false);
      await expect(service.inviteClient(practitionerId, inviteData)).rejects.toThrow(
        'Bad Request: Failed to send invitation email'
      );
    });

    it('should throw BadRequestException when email service throws error', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockPractitioner as never) // First call for practitioner
        .mockResolvedValueOnce(null); // Second call for existing user
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation as never);
      mockMailService.sendClientInvitation.mockRejectedValue(new Error('Failed to send invitation email'));
      await expect(service.inviteClient(practitionerId, inviteData)).rejects.toThrow('Failed to send invitation email');
    });
  });

  describe('getInvitationByToken', () => {
    const token = 'valid-token';

    const mockInvitation = {
      id: 'invitation-id',
      token,
      clientEmail: 'client@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      isAccepted: false,
      practitionerId: 'practitioner-id',
      intakeFormId: 'form-id',
    };

    it('should return valid invitation', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation as never);

      const result = await service.getInvitationByToken(token);

      expect(result).toEqual({
        clientEmail: 'client@example.com',
        isAccepted: false,
      });
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.getInvitationByToken(token)).rejects.toThrow(
        'Not Found: Invitation not found or has expired.'
      );
    });

    it('should throw NotFoundException when invitation is expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      mockPrismaService.invitation.findUnique.mockResolvedValue(expiredInvitation as never);

      await expect(service.getInvitationByToken(token)).rejects.toThrow(
        'Not Found: Invitation not found or has expired.'
      );
    });
  });

  describe('getInvitations', () => {
    const practitionerId = 'practitioner-id';

    const mockInvitations = [
      {
        id: 'invitation-1',
        clientEmail: 'client1@example.com',
        isAccepted: false,
        createdAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-01-08'),
        clientFirstName: 'John',
        clientLastName: 'Doe',
        token: 'token-1',
      },
      {
        id: 'invitation-2',
        clientEmail: 'client2@example.com',
        isAccepted: true,
        createdAt: new Date('2024-01-02'),
        expiresAt: new Date('2024-01-08'),
        clientFirstName: 'Jane',
        clientLastName: 'Smith',
        token: 'token-2',
      },
    ];

    it('should return all invitations for practitioner', async () => {
      mockPrismaService.invitation.findMany.mockResolvedValue(mockInvitations as never);

      const result = await service.getInvitations(practitionerId);

      expect(result).toEqual([
        {
          id: 'invitation-1',
          clientEmail: 'client1@example.com',
          clientFirstName: 'John',
          clientLastName: 'Doe',
          status: 'PENDING',
          invited: 'January 1, 2024',
          expiresAt: 'January 8, 2024',
          intakeFormTitle: undefined,
          avatar: expect.any(String),
        },
        {
          id: 'invitation-2',
          clientEmail: 'client2@example.com',
          clientFirstName: 'Jane',
          clientLastName: 'Smith',
          status: 'JOINED',
          invited: 'January 2, 2024',
          expiresAt: 'January 8, 2024',
          intakeFormTitle: undefined,
          avatar: expect.any(String),
        },
      ]);

      expect(mockPrismaService.invitation.findMany).toHaveBeenCalledWith({
        where: { practitionerId },
        include: { intakeForm: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getClients', () => {
    const practitionerId = 'practitioner-id';

    const mockClients = [
      {
        id: 'client-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        clientStatus: 'ACTIVE',
        avatarUrl: null,
        createdAt: new Date('2024-01-01'),
        _count: {
          intakeFormSubmissions: 1,
        },
      },
      {
        id: 'client-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        clientStatus: 'INACTIVE',
        avatarUrl: null,
        createdAt: new Date('2024-01-02'),
        _count: {
          intakeFormSubmissions: 0,
        },
      },
    ];

    it('should return all clients for practitioner', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockClients as never);

      const result = await service.getClients(practitionerId);

      expect(result).toEqual([
        {
          id: 'client-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          clientStatus: 'ACTIVE',
          avatarUrl: null,
          createdAt: new Date('2024-01-01'),
          hasCompletedIntake: true,
        },
        {
          id: 'client-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          clientStatus: 'INACTIVE',
          avatarUrl: null,
          createdAt: new Date('2024-01-02'),
          hasCompletedIntake: false,
        },
      ]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { practitionerId, role: 'CLIENT' },
        include: {
          _count: {
            select: { intakeFormSubmissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteInvitation', () => {
    const practitionerId = 'practitioner-id';
    const invitationId = 'invitation-id';

    const mockInvitation = {
      id: invitationId,
      practitionerId,
      clientEmail: 'client@example.com',
      isAccepted: false,
    };

    const mockPractitioner = {
      id: practitionerId,
      name: 'Dr. Smith',
      email: 'dr.smith@example.com',
      role: 'PRACTITIONER',
    };

    it('should successfully delete invitation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPractitioner as never);
      mockPrismaService.invitation.findFirst.mockResolvedValue(mockInvitation as never);
      mockPrismaService.invitation.delete.mockResolvedValue(mockInvitation as never);

      const result = await service.deleteInvitation(practitionerId, invitationId);

      expect(result).toEqual({ message: 'Invitation deleted successfully' });
      expect(mockPrismaService.invitation.delete).toHaveBeenCalledWith({
        where: { id: invitationId },
      });
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPractitioner as never);
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);

      await expect(service.deleteInvitation(practitionerId, invitationId)).rejects.toThrow(
        'Not Found: Invitation not found or you do not have permission to delete it.'
      );
    });

    it('should throw BadRequestException when invitation does not belong to practitioner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPractitioner as never);
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);

      await expect(service.deleteInvitation(practitionerId, invitationId)).rejects.toThrow(
        'Not Found: Invitation not found or you do not have permission to delete it.'
      );
    });
  });
});
