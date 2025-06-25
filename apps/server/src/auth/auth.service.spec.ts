import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@repo/db';
import { PractitionerSignUpDto } from './dto/auth.dto';

// Mock crypto
jest.mock('crypto', () => ({
  randomInt: jest.fn(() => 123456),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    otp: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    sendTemplateMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOtpAuth', () => {
    const email = 'test@example.com';

    it('should successfully send OTP and return true', async () => {
      mockPrismaService.otp.upsert.mockResolvedValue({} as never);
      mockMailService.sendTemplateMail.mockResolvedValue(true);

      const result = await service.handleOtpAuth(email);

      expect(result).toBe(true);
      expect(mockPrismaService.otp.upsert).toHaveBeenCalled();
      expect(mockMailService.sendTemplateMail).toHaveBeenCalled();
    });

    it('should handle email normalization', async () => {
      const emailWithSpaces = '  TEST@EXAMPLE.COM  ';
      mockPrismaService.otp.upsert.mockResolvedValue({} as never);
      mockMailService.sendTemplateMail.mockResolvedValue(true);

      await service.handleOtpAuth(emailWithSpaces);

      expect(mockPrismaService.otp.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' },
        })
      );
    });

    it('should return false when database operation fails', async () => {
      mockPrismaService.otp.upsert.mockRejectedValue(new Error('DB Error'));
      await expect(service.handleOtpAuth(email)).rejects.toThrow('DB Error');
    });

    it('should return false when email sending fails', async () => {
      mockPrismaService.otp.upsert.mockResolvedValue({} as never);
      mockMailService.sendTemplateMail.mockRejectedValue(new Error('Email Error'));

      const result = await service.handleOtpAuth(email);

      expect(result).toBe(true);
    });
  });

  describe('verifyOtp', () => {
    const email = 'test@example.com';
    const otp = '123456';
    const role = UserRole.PRACTITIONER;

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      firstName: undefined,
      lastName: undefined,
      role: UserRole.PRACTITIONER,
      isEmailVerified: false,
      avatarUrl: null,
      profession: 'Doctor',
    };

    const mockOtpRecord = {
      email: 'test@example.com',
      otp: '123456',
      expiresAt: new Date(Date.now() + 60000), // 1 minute from now
    };

    it('should successfully verify OTP and return login response', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as never);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true } as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.verifyOtp(email, otp, role);

      expect(result).toEqual({
        token: 'jwt-token',
        user: expect.objectContaining({
          id: 'user-id',
          email: 'test@example.com',
          firstName: undefined,
          lastName: undefined,
          avatarUrl: null,
          role: UserRole.PRACTITIONER,
          profession: 'Doctor',
        }),
      });
    });

    it('should throw UnauthorizedException when OTP record not found', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(null);

      await expect(service.verifyOtp(email, otp, role)).rejects.toThrow('Unauthorized: Invalid email or OTP');
    });

    it('should throw UnauthorizedException when OTP is expired', async () => {
      const expiredOtpRecord = {
        ...mockOtpRecord,
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      };
      mockPrismaService.otp.findUnique.mockResolvedValue(expiredOtpRecord as never);

      await expect(service.verifyOtp(email, otp, role)).rejects.toThrow('Unauthorized: OTP has expired');
    });

    it('should throw UnauthorizedException when OTP is incorrect', async () => {
      const wrongOtpRecord = {
        ...mockOtpRecord,
        otp: '654321',
      };
      mockPrismaService.otp.findUnique.mockResolvedValue(wrongOtpRecord as never);

      await expect(service.verifyOtp(email, otp, role)).rejects.toThrow('Unauthorized: Invalid OTP');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyOtp(email, otp, role)).rejects.toThrow(
        'Unauthorized: Account not found. Please sign up first or check your email.'
      );
    });

    it('should throw UnauthorizedException when user role does not match', async () => {
      const wrongRoleUser = {
        ...mockUser,
        role: UserRole.CLIENT,
      };
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(wrongRoleUser as never);

      await expect(service.verifyOtp(email, otp, role)).rejects.toThrow(
        'Unauthorized: Invalid role. Expected PRACTITIONER, got CLIENT'
      );
    });

    it('should update user email verification status', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as never);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true } as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.verifyOtp(email, otp, role);

      expect(result).toEqual({
        token: 'jwt-token',
        user: expect.objectContaining({
          id: 'user-id',
          email: 'test@example.com',
          firstName: undefined,
          lastName: undefined,
          avatarUrl: null,
          role: UserRole.PRACTITIONER,
          profession: 'Doctor',
        }),
      });
    });
  });

  describe('handlePractitionerSignUp', () => {
    const signupData: PractitionerSignUpDto = {
      email: 'practitioner@example.com',
      otp: '123456',
      role: UserRole.PRACTITIONER,
      firstName: 'Dr.',
      lastName: 'Smith',
      profession: 'Psychologist',
    };

    const mockOtpRecord = {
      email: 'practitioner@example.com',
      otp: '123456',
      expiresAt: new Date(Date.now() + 60000),
    };

    const mockPractitioner = {
      id: 'practitioner-id',
      email: 'practitioner@example.com',
      firstName: 'Dr.',
      lastName: 'Smith',
      role: UserRole.PRACTITIONER,
      profession: 'Psychologist',
      isEmailVerified: false,
      avatarUrl: null,
    };

    it('should successfully create new practitioner account', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockPractitioner as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.handlePractitionerSignUp(signupData);
      expect(result).toEqual({
        token: 'jwt-token',
        user: expect.objectContaining({
          id: 'practitioner-id',
          email: 'practitioner@example.com',
          firstName: 'Dr.',
          lastName: 'Smith',
          role: 'PRACTITIONER',
          profession: 'Psychologist',
        }),
      });
    });

    it('should throw UnauthorizedException when OTP is invalid', async () => {
      mockPrismaService.otp.findUnique.mockResolvedValue(null);
      await expect(service.handlePractitionerSignUp(signupData)).rejects.toThrow('Unauthorized: Invalid email or OTP');
    });

    it('should throw ConflictException when user exists with different role', async () => {
      const clientUser = {
        ...mockPractitioner,
        role: UserRole.CLIENT,
      };
      mockPrismaService.otp.findUnique.mockResolvedValue(mockOtpRecord as never);
      mockPrismaService.user.findUnique.mockResolvedValue(clientUser as never);
      await expect(service.handlePractitionerSignUp(signupData)).rejects.toThrow(
        'Conflict: An account with this email already exists'
      );
    });
  });

  describe('handleClientSignUp', () => {
    const clientSignUpData = {
      email: 'client@example.com',
      firstName: 'Client',
      lastName: 'User',
      invitationToken: 'valid-token',
    };

    const mockInvitation = {
      id: 'invitation-id',
      clientEmail: 'client@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isAccepted: false,
    };

    const mockUser = {
      id: 'user-id',
      email: 'client@example.com',
      firstName: 'Client',
      lastName: 'User',
      role: UserRole.CLIENT,
      isEmailVerified: true,
      avatarUrl: null,
      profession: null,
    };

    it('should successfully create client account', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation as never);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser as never);
      mockPrismaService.invitation.update.mockResolvedValue({ ...mockInvitation, isAccepted: true } as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');
      const result = await service.handleClientSignUp(clientSignUpData);
      expect(result).toEqual({
        token: 'jwt-token',
        user: expect.objectContaining({
          id: 'user-id',
          email: 'client@example.com',
          firstName: 'Client',
          lastName: 'User',
          role: 'CLIENT',
        }),
      });
    });

    it('should throw UnauthorizedException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);
      await expect(service.handleClientSignUp(clientSignUpData)).rejects.toThrow(
        'Unauthorized: Invalid invitation token'
      );
    });

    it('should throw UnauthorizedException when invitation is expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      mockPrismaService.invitation.findUnique.mockResolvedValue(expiredInvitation as never);
      await expect(service.handleClientSignUp(clientSignUpData)).rejects.toThrow(
        'Unauthorized: This invitation has expired'
      );
    });

    it('should throw UnauthorizedException when email does not match invitation', async () => {
      const wrongEmailInvitation = {
        ...mockInvitation,
        clientEmail: 'different@example.com',
      };
      mockPrismaService.invitation.findUnique.mockResolvedValue(wrongEmailInvitation as never);
      await expect(service.handleClientSignUp(clientSignUpData)).rejects.toThrow(
        'Unauthorized: Email does not match the invitation'
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation as never);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as never);
      await expect(service.handleClientSignUp(clientSignUpData)).rejects.toThrow(
        'Conflict: An account with this email already exists'
      );
    });
  });
});
