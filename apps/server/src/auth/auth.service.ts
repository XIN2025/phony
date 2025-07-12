import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, Invitation, UserRole } from '@repo/db';
import { User as UserDto } from '@repo/shared-types';
import { generateOtp } from '../common/utils/auth.utils';
import {
  decodeInvitationToken,
  determineClientStatus,
  generateToken,
  generateUniqueFilename,
  normalizeEmail,
  saveFileToUploads,
  throwAuthError,
  validateFileUpload,
  validateRequiredFields,
} from '../common/utils/user.utils';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginResponseDto, ProfileUpdateBody, ClientSignUpDto } from './dto/auth.dto';

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profession?: string;
  phoneNumber?: string;
  allergies?: string[];
  medicalHistory?: string[];
  symptoms?: string[];
  medications?: string[];
  notificationSettings?: object | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      profession: user.profession ?? null,
      clientStatus: user.clientStatus ?? undefined,
      practitionerId: user.practitionerId ?? null,
      isEmailVerified: user.isEmailVerified,
      idProofUrl: user.idProofUrl ?? null,
      phoneNumber: user.phoneNumber ?? null,
      allergies: user.allergies ?? null,
      medicalHistory: user.medicalHistory ?? null,
      symptoms: user.symptoms ?? null,
      medications: user.medications ?? null,
      notificationSettings: user.notificationSettings ?? null,
    } as UserDto;
  }

  async sendOtp(email: string): Promise<{ success: boolean }> {
    validateRequiredFields({ email }, ['email']);
    const normalizedEmail = normalizeEmail(email);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await this.prismaService.otp.upsert({
        where: { email: normalizedEmail },
        update: { otp, expiresAt },
        create: { email: normalizedEmail, otp, expiresAt },
      });
    } catch {
      throwAuthError('Failed to process OTP request.', 'badRequest');
    }

    try {
      await this.mailService.sendTemplateMail({
        to: normalizedEmail,
        subject: 'Your OTP Code',
        templateName: 'OTP',
        context: {
          otp: otp,
          validity: 10,
        },
      });
    } catch {
      throwAuthError('Failed to send OTP email.', 'badRequest');
    }

    return { success: true };
  }

  async handleOtpAuth(email: string): Promise<{ success: boolean }> {
    return this.sendOtp(email);
  }

  private async validateOtp(email: string, otp: string, shouldDelete: boolean = true): Promise<void> {
    validateRequiredFields({ email, otp }, ['email', 'otp']);
    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = otp.trim();

    const otpRecord = await this.prismaService.otp.findUnique({ where: { email: normalizedEmail } });
    if (!otpRecord) throwAuthError('Invalid email or OTP', 'unauthorized');
    if (otpRecord.otp !== normalizedOtp) throwAuthError('Invalid OTP', 'unauthorized');
    if (otpRecord.expiresAt < new Date()) throwAuthError('OTP has expired', 'unauthorized');

    if (shouldDelete) {
      await this.prismaService.otp.delete({ where: { email: normalizedEmail } });
    }
  }

  async verifyOtp(email: string, otp: string, role: 'CLIENT' | 'PRACTITIONER'): Promise<LoginResponseDto> {
    const normalizedEmail = normalizeEmail(email);

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      include: { clients: true },
    });

    if (!user) {
      throwAuthError('Account not found. Please sign up first or check your email.', 'unauthorized');
    }

    await this.validateOtp(email, otp, false);

    if (user.role !== role) {
      throwAuthError(`Invalid role. Expected ${role}, got ${user.role}`, 'unauthorized');
    }

    const token = await generateToken(this.jwtService, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      role: user.role,
      practitionerId: user.practitionerId,
      clientStatus: user.clientStatus ?? undefined,
    });

    await this.prismaService.otp.delete({ where: { email: normalizedEmail } });

    return {
      user: this.toUserDto(user),
      token,
    };
  }

  async verifyInvitationOtp(
    email: string,
    otp: string,
    invitationToken: string
  ): Promise<{ success: boolean; invitation: Record<string, unknown> }> {
    validateRequiredFields({ email, otp, invitationToken }, ['email', 'otp', 'invitationToken']);
    const normalizedEmail = normalizeEmail(email);

    const { invitation } = await this.validateInvitation(invitationToken);

    if (invitation.clientEmail.toLowerCase() !== normalizedEmail) {
      throwAuthError('Email does not match the invitation', 'unauthorized');
    }

    await this.validateOtp(email, otp, true);

    return {
      success: true,
      invitation: {
        id: invitation.id,
        clientEmail: invitation.clientEmail,
        practitionerId: invitation.practitionerId,
        intakeFormId: invitation.intakeFormId,
      },
    };
  }

  async checkInvitationIntakeForm(invitationToken: string): Promise<{ hasIntakeForm: boolean }> {
    validateRequiredFields({ invitationToken }, ['invitationToken']);

    const { invitation } = await this.validateInvitation(invitationToken);

    return {
      hasIntakeForm: !!invitation.intakeFormId,
    };
  }

  async handlePractitionerSignUp(
    data: {
      email: string;
      firstName: string;
      lastName?: string;
      profession: string;
    },
    file?: Express.Multer.File,
    idProofFile?: Express.Multer.File
  ): Promise<LoginResponseDto> {
    validateRequiredFields(data, ['email', 'firstName', 'profession']);
    const { email, firstName, lastName, profession } = data;
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName?.trim() ?? '';
    const normalizedProfession = profession.trim();

    const existingUser = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throwAuthError('An account with this email already exists', 'conflict');

    let avatarUrl: string | undefined = undefined;
    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      const savedFilename = await saveFileToUploads(file, filename);
      avatarUrl = `/uploads/${savedFilename}`;
    }

    let idProofUrl: string | undefined = undefined;
    if (idProofFile && idProofFile.buffer) {
      const validation = validateFileUpload(idProofFile);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid ID proof file', 'badRequest');
      }
      const filename = generateUniqueFilename(idProofFile.originalname);
      const savedFilename = await saveFileToUploads(idProofFile, filename);
      idProofUrl = `/uploads/${savedFilename}`;
    }

    const user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: 'PRACTITIONER',
        avatarUrl,
        idProofUrl,
        profession: normalizedProfession,
      },
      include: { clients: true },
    });

    const token = await generateToken(this.jwtService, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      role: user.role,
      practitionerId: user.practitionerId,
      clientStatus: user.clientStatus ?? undefined,
    });

    return {
      user: this.toUserDto(user),
      token,
    };
  }

  async validateInvitation(invitationToken: string): Promise<{ invitation: Invitation; isAccepted: boolean }> {
    let invitation = await this.prismaService.invitation.findUnique({
      where: { token: invitationToken },
      include: { practitioner: true },
    });
    if (!invitation) {
      const decodedToken = decodeInvitationToken(invitationToken);
      invitation = await this.prismaService.invitation.findUnique({
        where: { token: decodedToken },
        include: { practitioner: true },
      });
    }
    if (!invitation) throwAuthError('Invalid invitation token', 'unauthorized');
    if (invitation.expiresAt < new Date()) throwAuthError('This invitation has expired', 'unauthorized');

    return {
      invitation,
      isAccepted: invitation.status === 'ACCEPTED',
    };
  }

  async handleClientSignUp(data: ClientSignUpDto, file?: Express.Multer.File): Promise<LoginResponseDto> {
    const {
      email,
      firstName,
      lastName,
      invitationToken,
      dob,
      gender,
      profession,
      phoneNumber,
      allergies,
      medicalHistory,
      symptoms,
      medications,
      notificationSettings,
    } = data;

    validateRequiredFields({ email, firstName, invitationToken }, ['email', 'firstName', 'invitationToken']);

    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName?.trim() ?? '';

    const { invitation, isAccepted } = await this.validateInvitation(invitationToken);

    if (isAccepted) throwAuthError('This invitation has already been used', 'unauthorized');
    if (invitation.clientEmail.toLowerCase() !== normalizedEmail)
      throwAuthError('Email does not match the invitation', 'unauthorized');

    let user = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });

    if (user) throwAuthError('An account with this email already exists', 'conflict');
    const clientStatus = determineClientStatus(invitation.intakeFormId || undefined);

    let avatarUrl: string | undefined = undefined;
    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      const savedFilename = await saveFileToUploads(file, filename);
      avatarUrl = `/uploads/${savedFilename}`;
    }

    const userData = {
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      role: UserRole.CLIENT,
      avatarUrl,
      clientStatus,
      practitionerId: invitation.practitionerId,
      dob: dob || '',
      gender: gender || '',
      profession: profession || '',
      phoneNumber: phoneNumber || '',
      allergies: allergies || [],
      medicalHistory:
        typeof medicalHistory === 'string'
          ? (() => {
              try {
                return JSON.parse(medicalHistory);
              } catch {
                return [];
              }
            })()
          : medicalHistory || [],
      symptoms:
        typeof symptoms === 'string'
          ? (() => {
              try {
                return JSON.parse(symptoms);
              } catch {
                return [];
              }
            })()
          : symptoms || [],
      medications:
        typeof medications === 'string'
          ? (() => {
              try {
                return JSON.parse(medications);
              } catch {
                return [];
              }
            })()
          : medications || [],
      notificationSettings: notificationSettings || null,
    };

    user = await this.prismaService.user.create({
      data: userData,
      include: { clients: true },
    });

    await this.prismaService.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    const token = await generateToken(this.jwtService, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      role: user.role,
      practitionerId: user.practitionerId,
      clientStatus: user.clientStatus ?? undefined,
    });

    return {
      user: this.toUserDto(user),
      token,
    };
  }

  async completeProfile(
    userId: string,
    data: { firstName?: string; lastName?: string },
    file?: Express.Multer.File
  ): Promise<LoginResponseDto['user']> {
    validateRequiredFields({ userId }, ['userId']);

    let avatarUrl: string | undefined = undefined;
    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      const savedFilename = await saveFileToUploads(file, filename);
      avatarUrl = `/uploads/${savedFilename}`;
    }

    const updateData: Record<string, string> = {};
    if (data.firstName?.trim()) updateData.firstName = data.firstName.trim();
    if (data.lastName?.trim()) updateData.lastName = data.lastName.trim();
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
      include: { clients: true },
    });

    return this.toUserDto(user);
  }

  async updateProfile(
    userId: string,
    body: ProfileUpdateBody,
    file?: Express.Multer.File
  ): Promise<LoginResponseDto['user']> {
    const dataToUpdate: ProfileUpdateData = {};
    if (body.firstName) dataToUpdate.firstName = body.firstName;
    if (body.lastName || body.lastName === '') dataToUpdate.lastName = body.lastName;
    if (body.profession) dataToUpdate.profession = body.profession;
    if (body.phoneNumber !== undefined) dataToUpdate.phoneNumber = body.phoneNumber;

    if (body.allergies) {
      try {
        dataToUpdate.allergies = typeof body.allergies === 'string' ? JSON.parse(body.allergies) : body.allergies;
      } catch {
        dataToUpdate.allergies = [];
      }
    }
    if (body.medicalHistory) {
      try {
        dataToUpdate.medicalHistory =
          typeof body.medicalHistory === 'string' ? JSON.parse(body.medicalHistory) : body.medicalHistory;
      } catch {
        dataToUpdate.medicalHistory = [];
      }
    }
    if (body.symptoms) {
      try {
        dataToUpdate.symptoms = typeof body.symptoms === 'string' ? JSON.parse(body.symptoms) : body.symptoms;
      } catch {
        dataToUpdate.symptoms = [];
      }
    }
    if (body.medications) {
      try {
        dataToUpdate.medications =
          typeof body.medications === 'string' ? JSON.parse(body.medications) : body.medications;
      } catch {
        dataToUpdate.medications = [];
      }
    }
    if (body.notificationSettings) {
      try {
        const notificationSettings =
          typeof body.notificationSettings === 'string'
            ? JSON.parse(body.notificationSettings)
            : body.notificationSettings;
        dataToUpdate.notificationSettings = notificationSettings;
      } catch {
        dataToUpdate.notificationSettings = null;
      }
    }

    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      const savedFilename = await saveFileToUploads(file, filename);
      dataToUpdate.avatarUrl = `/uploads/${savedFilename}`;
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { clients: true },
    });

    return this.toUserDto(user);
  }

  async getCurrentUser(userId: string): Promise<LoginResponseDto['user']> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throwAuthError('User not found', 'notFound');
    }

    return this.toUserDto(user);
  }
}
