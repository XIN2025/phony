import { Injectable, Logger, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/common/config';
import { generateOtp } from 'src/common/utils/auth.utils';
import { MailService } from 'src/mail/mail.service';
import { LoginResponseDto, PractitionerSignUpDto } from './dto/auth.dto';
import { UserRole } from '@repo/db';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  async handleOtpAuth(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      await this.generateAndSendOtp(normalizedEmail);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${normalizedEmail}:`, error);
      return false;
    }
  }

  async verifyOtp(email: string, otp: string, role: UserRole): Promise<LoginResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    const otpRecord = await this.prismaService.otp.findFirst({
      where: { email: normalizedEmail },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP. Please request a new one.');
    }

    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otpRecord.otp !== normalizedOtp) {
      throw new UnauthorizedException('The OTP you entered is incorrect.');
    }

    let user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please sign up first.');
    }

    if (user.role !== role) {
      throw new UnauthorizedException('Invalid role for this user.');
    }

    // Mark email as verified
    if (!user.isEmailVerified) {
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
      role: user.role,
      profession: user.profession,
      sub: user.id,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  async handlePractitionerSignUp(data: PractitionerSignUpDto): Promise<LoginResponseDto> {
    const { email, otp, name, profession } = data;

    // Validate input
    if (!email?.trim() || !otp?.trim() || !name?.trim() || !profession?.trim()) {
      throw new BadRequestException('Email, OTP, name, and profession are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedProfession = profession.trim();

    const otpRecord = await this.prismaService.otp.findFirst({
      where: { email: normalizedEmail },
    });
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP. Please request a new one.');
    }
    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }
    if (otpRecord.otp !== otp.trim()) {
      throw new UnauthorizedException('The OTP you entered is incorrect.');
    }

    let user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.role !== UserRole.PRACTITIONER) {
      throw new ConflictException('An account with this email already exists with a different role.');
    }

    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedName,
          profession: normalizedProfession,
          role: UserRole.PRACTITIONER,
          isEmailVerified: true,
        },
      });
    } else {
      // User exists, update their details if they were missing
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? normalizedName,
          profession: user.profession ?? normalizedProfession,
          isEmailVerified: true,
        },
      });
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
      role: user.role,
      profession: user.profession,
      sub: user.id,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  async handleClientSignUp(data: { email: string; name: string; invitationToken: string }): Promise<LoginResponseDto> {
    const { email, name, invitationToken } = data;

    // Validate input
    if (!email?.trim() || !name?.trim() || !invitationToken?.trim()) {
      throw new BadRequestException('Email, name, and invitation token are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    // Find and validate the invitation
    const invitation = await this.prismaService.invitation.findUnique({
      where: { token: invitationToken },
      include: { practitioner: true },
    });

    if (!invitation) {
      throw new UnauthorizedException('Invalid invitation token');
    }

    if (invitation.isAccepted) {
      throw new UnauthorizedException('This invitation has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new UnauthorizedException('This invitation has expired');
    }

    if (invitation.clientEmail.toLowerCase() !== normalizedEmail) {
      throw new UnauthorizedException('Email does not match the invitation');
    }

    // Check if user already exists
    let user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      throw new ConflictException('An account with this email already exists');
    }

    // Create the client account
    user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        role: UserRole.CLIENT,
        practitionerId: invitation.practitionerId,
        isEmailVerified: true,
      },
    });

    // Mark invitation as accepted
    await this.prismaService.invitation.update({
      where: { id: invitation.id },
      data: { isAccepted: true },
    });

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
      role: user.role,
      profession: user.profession,
      sub: user.id,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  private async generateAndSendOtp(email: string) {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    this.logger.debug(`[OTP Flow] Step 1: Starting OTP generation for ${normalizedEmail}.`);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5-minute expiry
    this.logger.debug(`[OTP Flow] Step 2: Generated OTP ${otp} for ${normalizedEmail}.`);

    try {
      this.logger.debug(`[OTP Flow] Step 3: Attempting to save OTP to the database for ${normalizedEmail}.`);
      await this.prismaService.otp.upsert({
        where: { email: normalizedEmail },
        update: { otp, expiresAt },
        create: { email: normalizedEmail, otp, expiresAt },
      });
      this.logger.debug(`[OTP Flow] Step 4: Successfully saved OTP to the database for ${normalizedEmail}.`);
    } catch (dbError) {
      this.logger.error(`[OTP Flow] CRITICAL: Database write failed for ${normalizedEmail}.`, dbError);
      throw new Error('Could not save the OTP. Please try again.');
    }

    try {
      this.logger.debug(`[OTP Flow] Step 5: Attempting to send email to ${normalizedEmail}.`);
      await this.mailService.sendTemplateMail({
        to: normalizedEmail,
        subject: 'Your Verification Code for Continuum',
        templateName: 'OTP',
        context: {
          otp: otp,
          validity: 5,
        },
      });
      this.logger.debug(`[OTP Flow] Step 6: Successfully sent email to ${normalizedEmail}.`);
    } catch (emailError) {
      this.logger.error(`[OTP Flow] Email sending failed for ${normalizedEmail}.`, emailError);
      // The OTP was still saved, but the email failed.
      // Inform the user that the email failed.
      throw new Error('Failed to send verification email.');
    }
  }
}
