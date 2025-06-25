import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/common/config';
import { generateOtp } from 'src/common/utils/auth.utils';
import { MailService } from 'src/mail/mail.service';
import { LoginResponseDto, PractitionerSignUpDto } from './dto/auth.dto';
import { UserRole } from '@repo/db';
import {
  normalizeEmail,
  createUserResponse,
  decodeInvitationToken,
  throwAuthError,
  validateRequiredFields,
  generateToken,
  determineClientStatus,
  validateFileUpload,
  uploadFile,
} from 'src/common/utils/user.utils';
import { UPLOAD_CONSTANTS } from 'src/common/utils/constants';

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

    // Store OTP in database first
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + config.otp.expiryMs);

    await this.prismaService.otp.upsert({
      where: { email: normalizedEmail },
      update: { otp, expiresAt },
      create: { email: normalizedEmail, otp, expiresAt },
    });

    // Send email asynchronously to avoid blocking the response
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

  async verifyOtpForSignup(email: string, otp: string): Promise<boolean> {
    validateRequiredFields({ email, otp }, ['email', 'otp']);
    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = otp.trim();

    const otpRecord = await this.prismaService.otp.findUnique({ where: { email: normalizedEmail } });
    if (!otpRecord) throwAuthError('Invalid email or OTP', 'unauthorized');
    if (otpRecord.otp !== normalizedOtp) throwAuthError('Invalid OTP', 'unauthorized');
    if (otpRecord.expiresAt < new Date()) throwAuthError('OTP has expired', 'unauthorized');

    // For signup - just verify OTP is correct
    await this.prismaService.otp.delete({ where: { email: normalizedEmail } });
    return true;
  }

  async verifyOtp(email: string, otp: string, role: UserRole): Promise<LoginResponseDto> {
    validateRequiredFields({ email, otp }, ['email', 'otp']);
    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = otp.trim();
    const otpRecord = await this.prismaService.otp.findUnique({ where: { email: normalizedEmail } });
    if (!otpRecord) throwAuthError('Invalid email or OTP', 'unauthorized');
    if (otpRecord.otp !== normalizedOtp) throwAuthError('Invalid OTP', 'unauthorized');
    if (otpRecord.expiresAt < new Date()) throwAuthError('OTP has expired', 'unauthorized');

    const user = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });

    // For login flow - user must exist
    if (!user) {
      throwAuthError('Account not found. Please sign up first or check your email.', 'unauthorized');
    }

    // Verify role matches
    if (user.role !== role) {
      throwAuthError(`Invalid role. Expected ${role}, got ${user.role}`, 'unauthorized');
    }

    // Mark email as verified if not already
    if (!user.isEmailVerified) {
      await this.prismaService.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
    }

    // Clean up OTP and generate token
    await this.prismaService.otp.delete({ where: { email: normalizedEmail } });
    const token = await generateToken(this.jwtService, user, {}, config.jwt.expiresIn);
    return { token, user: createUserResponse(user) };
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
    const normalizedOtp = otp.trim();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedProfession = profession.trim();

    // First verify the OTP
    const otpRecord = await this.prismaService.otp.findUnique({ where: { email: normalizedEmail } });
    if (!otpRecord) throwAuthError('Invalid email or OTP', 'unauthorized');
    if (otpRecord.otp !== normalizedOtp) throwAuthError('Invalid OTP', 'unauthorized');
    if (otpRecord.expiresAt < new Date()) throwAuthError('OTP has expired', 'unauthorized');

    const existingUser = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throwAuthError('An account with this email already exists', 'conflict');

    // Clean up OTP
    await this.prismaService.otp.delete({ where: { email: normalizedEmail } });

    let avatarUrl: string | undefined = undefined;
    if (file && file.buffer) {
      validateFileUpload(file, [...UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES], UPLOAD_CONSTANTS.MAX_FILE_SIZE);
      avatarUrl = await uploadFile(file, normalizedEmail, UPLOAD_CONSTANTS.UPLOAD_PATH, UPLOAD_CONSTANTS.UPLOAD_DIR);
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

    const token = await generateToken(this.jwtService, user, {}, config.jwt.expiresIn);
    return { token, user: createUserResponse(user) };
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
      validateFileUpload(file, [...UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES], UPLOAD_CONSTANTS.MAX_FILE_SIZE);
      avatarUrl = await uploadFile(file, normalizedEmail, UPLOAD_CONSTANTS.UPLOAD_PATH, UPLOAD_CONSTANTS.UPLOAD_DIR);
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
    const token = await generateToken(this.jwtService, user, { clientStatus: user.clientStatus }, config.jwt.expiresIn);
    return { token, user: createUserResponse(user) };
  }

  async updateProfile(userId: string, body: ProfileUpdateBody, file?: Express.Multer.File) {
    const updateData: ProfileUpdateData = {
      firstName: body.firstName,
      lastName: body.lastName,
    };

    if (file && file.buffer) {
      validateFileUpload(file, [...UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES], UPLOAD_CONSTANTS.MAX_FILE_SIZE);
      updateData.avatarUrl = await uploadFile(file, userId, UPLOAD_CONSTANTS.UPLOAD_PATH, UPLOAD_CONSTANTS.UPLOAD_DIR);
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });

    return createUserResponse(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throwAuthError('User not found', 'notFound');
    }

    return createUserResponse(user);
  }
}
