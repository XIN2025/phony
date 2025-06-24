import { Injectable, Logger, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/common/config';
import { generateOtp } from 'src/common/utils/auth.utils';
import { MailService } from 'src/mail/mail.service';
import { LoginResponseDto, PractitionerSignUpDto } from './dto/auth.dto';
import { UserRole } from '@repo/db';
import { promises as fs } from 'fs';
import * as path from 'path';

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
    if (!email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    await this.generateAndSendOtp(normalizedEmail);
    return true;
  }

  async verifyOtp(email: string, otp: string, role: UserRole): Promise<LoginResponseDto> {
    if (!email?.trim() || !otp?.trim()) {
      throw new BadRequestException('Email and OTP are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    const otpRecord = await this.prismaService.otp.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (otpRecord.otp !== normalizedOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      if (role === UserRole.PRACTITIONER) {
        throw new UnauthorizedException('Practitioner account not found. Please sign up first.');
      }
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== role) {
      throw new UnauthorizedException(`Invalid role. Expected ${role}, got ${user.role}`);
    }

    if (!user.isEmailVerified) {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    await this.prismaService.otp.delete({
      where: { email: normalizedEmail },
    });

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      firstName: user.firstName,
      lastName: user.lastName,
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
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  async handlePractitionerSignUp(data: PractitionerSignUpDto): Promise<LoginResponseDto> {
    const { email, firstName, lastName, profession } = data;

    if (!email?.trim() || !firstName?.trim() || !lastName?.trim() || !profession?.trim()) {
      throw new BadRequestException('Email, first name, last name, and profession are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedProfession = profession.trim();

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: UserRole.PRACTITIONER,
        profession: normalizedProfession,
        isEmailVerified: true,
      },
    });

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      firstName: user.firstName,
      lastName: user.lastName,
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
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  async handleClientSignUp(data: {
    email: string;
    firstName: string;
    lastName: string;
    invitationToken: string;
  }): Promise<LoginResponseDto> {
    const { email, firstName, lastName, invitationToken } = data;

    if (!email?.trim() || !firstName?.trim() || !lastName?.trim() || !invitationToken?.trim()) {
      throw new BadRequestException('Email, first name, last name, and invitation token are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

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

    let user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      throw new ConflictException('An account with this email already exists');
    }

    user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: UserRole.CLIENT,
        practitionerId: invitation.practitionerId,
        isEmailVerified: true,
      },
    });

    await this.prismaService.invitation.update({
      where: { id: invitation.id },
      data: { isAccepted: true },
    });

    const jwtPayload = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      firstName: user.firstName,
      lastName: user.lastName,
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
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        profession: user.profession,
      },
    };
  }

  private async generateAndSendOtp(email: string) {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prismaService.otp.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt },
    });

    await this.mailService.sendTemplateMail({
      to: email,
      subject: 'Your Verification Code for Continuum',
      templateName: 'OTP',
      context: {
        otp: otp,
        validity: 10,
      },
    });
  }

  async updateProfile(userId: string, body: ProfileUpdateBody, file?: Express.Multer.File) {
    console.log('updateProfile called with:', {
      userId,
      body,
      hasFile: !!file,
      fileInfo: file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hasBuffer: !!file.buffer,
            bufferLength: file.buffer?.length,
          }
        : null,
    });

    const updateData: ProfileUpdateData = {
      firstName: body.firstName,
      lastName: body.lastName,
    };

    if (file && file.buffer) {
      console.log('Processing file upload...');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const ext = path.extname(file.originalname);
      const fileName = `avatar_${userId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, file.buffer);

      updateData.avatarUrl = `/uploads/${fileName}`;
      console.log('File saved to:', filePath);
    } else {
      console.log('No file or file.buffer is missing');
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      profession: user.profession,
    };
  }
}
