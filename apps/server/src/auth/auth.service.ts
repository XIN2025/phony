import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@repo/db';
import { config } from 'src/common/config';
import { generateOtp } from 'src/common/utils/auth.utils';
import {
  createUserResponse,
  decodeInvitationToken,
  determineClientStatus,
  generateToken,
  normalizeEmail,
  normalizeUserData,
  throwAuthError,
  saveFileToUploads,
  generateUniqueFilename,
  validateFileUpload,
  validateRequiredFields,
} from 'src/common/utils/user.utils';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginResponseDto, PractitionerSignUpDto } from './dto/auth.dto';

interface ProfileUpdateBody {
  firstName?: string;
  lastName?: string;
  profession?: string;
  [key: string]: unknown;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  async handleOtpAuth(email: string): Promise<boolean> {
    validateRequiredFields({ email }, ['email']);
    const normalizedEmail = normalizeEmail(email);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + config.otp.expiryMs);

    await this.prismaService.otp.upsert({
      where: { email: normalizedEmail },
      update: { otp, expiresAt },
      create: { email: normalizedEmail, otp, expiresAt },
    });

    this.sendOtpEmailAsync(normalizedEmail, otp).catch((error) => {
      this.logger.error(`Failed to send OTP email to ${normalizedEmail}:`, error);
    });

    return true;
  }

  private async sendOtpEmailAsync(email: string, otp: string): Promise<void> {
    try {
      await this.mailService.sendTemplateMail({
        to: email,
        subject: 'Your Verification Code for Continuum',
        templateName: 'OTP',
        context: {
          otp: otp,
          validity: config.otp.expiryMinutes,
        },
      });
      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
    }
  }

  /**
   * Centralized OTP validation method to eliminate code duplication
   */
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

  async verifyOtp(email: string, otp: string, role: UserRole): Promise<LoginResponseDto> {
    await this.validateOtp(email, otp, true);
    const normalizedEmail = normalizeEmail(email);

    const user = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throwAuthError('Account not found. Please sign up first or check your email.', 'unauthorized');
    }

    if (user.role !== role) {
      throwAuthError(`Invalid role. Expected ${role}, got ${user.role}`, 'unauthorized');
    }

    if (!user.isEmailVerified) {
      await this.prismaService.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
    }

    const normalizedUser = normalizeUserData(user);
    const token = await generateToken(this.jwtService, normalizedUser, {}, config.jwt.expiresIn);
    return { token, user: createUserResponse(normalizedUser) };
  }

  async handlePractitionerSignUp(data: PractitionerSignUpDto, file?: Express.Multer.File): Promise<LoginResponseDto> {
    validateRequiredFields(data as unknown as Record<string, unknown>, [
      'email',
      'otp',
      'firstName',
      'lastName',
      'profession',
    ]);
    const { email, otp, firstName, lastName, profession } = data;
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedProfession = profession.trim();

    await this.validateOtp(email, otp, true);

    const existingUser = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throwAuthError('An account with this email already exists', 'conflict');

    let avatarUrl: string | undefined = undefined;
    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      avatarUrl = await saveFileToUploads(file, filename);
    }

    const user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: UserRole.PRACTITIONER,
        profession: normalizedProfession,
        isEmailVerified: true,
        avatarUrl: avatarUrl,
      },
    });

    const normalizedUser = normalizeUserData(user);
    const token = await generateToken(this.jwtService, normalizedUser, {}, config.jwt.expiresIn);
    return { token, user: createUserResponse(normalizedUser) };
  }

  async handleClientSignUp(
    data: {
      email: string;
      firstName: string;
      lastName: string;
      invitationToken: string;
    },
    file?: Express.Multer.File
  ): Promise<LoginResponseDto> {
    validateRequiredFields(data, ['email', 'firstName', 'lastName', 'invitationToken']);
    const { email, firstName, lastName, invitationToken } = data;
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
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
    if (invitation.isAccepted) throwAuthError('This invitation has already been used', 'unauthorized');
    if (invitation.expiresAt < new Date()) throwAuthError('This invitation has expired', 'unauthorized');
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
      avatarUrl = await saveFileToUploads(file, filename);
    }

    user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: UserRole.CLIENT,
        practitionerId: invitation.practitionerId,
        isEmailVerified: true,
        clientStatus: clientStatus,
        avatarUrl: avatarUrl,
      },
    });
    await this.prismaService.invitation.update({ where: { id: invitation.id }, data: { isAccepted: true } });
    const normalizedUser = normalizeUserData(user);
    const token = await generateToken(
      this.jwtService,
      normalizedUser,
      { clientStatus: normalizedUser.clientStatus },
      config.jwt.expiresIn
    );
    return { token, user: createUserResponse(normalizedUser) };
  }

  async updateProfile(userId: string, body: ProfileUpdateBody, file?: Express.Multer.File) {
    const updateData: ProfileUpdateData = {
      firstName: body.firstName,
      lastName: body.lastName,
    };

    if (file && file.buffer) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throwAuthError(validation.error || 'Invalid file', 'badRequest');
      }
      const filename = generateUniqueFilename(file.originalname);
      updateData.avatarUrl = await saveFileToUploads(file, filename);
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });

    const normalizedUser = normalizeUserData(user);
    return createUserResponse(normalizedUser);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throwAuthError('User not found', 'notFound');
    }

    const normalizedUser = normalizeUserData(user);
    return createUserResponse(normalizedUser);
  }
}
