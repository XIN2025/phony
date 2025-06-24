import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { config } from '../common/config';
import { randomBytes } from 'crypto';

export interface InviteClientDto {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  intakeFormId?: string;
}

export interface InvitationResponse {
  id: string;
  clientEmail: string;
  clientFirstName: string;
  clientLastName: string;
  status: 'PENDING' | 'JOINED';
  invited?: string;
  avatar?: string;
  createdAt: Date;
}

@Injectable()
export class PractitionerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async inviteClient(practitionerId: string, inviteData: InviteClientDto): Promise<InvitationResponse> {
    const { clientFirstName, clientLastName, clientEmail, intakeFormId } = inviteData;

    if (!clientFirstName?.trim() || !clientLastName?.trim() || !clientEmail?.trim()) {
      throw new BadRequestException('Client first name, last name, and email are required');
    }

    const normalizedEmail = clientEmail.trim().toLowerCase();
    const normalizedFirstName = clientFirstName.trim();
    const normalizedLastName = clientLastName.trim();

    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      throw new NotFoundException('Practitioner not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        practitionerId,
        clientEmail: normalizedEmail,
      },
    });

    let invitation;

    if (existingInvitation) {
      if (existingInvitation.isAccepted) {
        throw new BadRequestException('This client has already been invited and accepted the invitation');
      }

      invitation = await this.prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          clientFirstName: normalizedFirstName,
          clientLastName: normalizedLastName,
          intakeFormId,

          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      invitation = await this.prisma.invitation.create({
        data: {
          practitionerId,
          clientEmail: normalizedEmail,
          clientFirstName: normalizedFirstName,
          clientLastName: normalizedLastName,
          token,
          expiresAt,
          intakeFormId,
        },
      });
    }

    let intakeFormTitle: string | undefined;
    if (intakeFormId) {
      const form = await this.prisma.intakeForm.findUnique({ where: { id: intakeFormId } });
      intakeFormTitle = form?.title;
    }

    try {
      const invitationLink = `${config.frontendUrl}/client/auth/signup?token=${encodeURIComponent(invitation.token)}`;

      const practitionerName =
        practitioner.firstName && practitioner.lastName
          ? `${practitioner.firstName} ${practitioner.lastName}`
          : 'Your Practitioner';

      const emailSent = await this.mailService.sendClientInvitation({
        to: normalizedEmail,
        clientName: `${normalizedFirstName} ${normalizedLastName}`,
        practitionerName,
        invitationLink: invitationLink,
        intakeFormTitle,
      });

      if (!emailSent) {
        throw new BadRequestException('Failed to send invitation email');
      }
    } catch {
      throw new BadRequestException('Failed to send invitation email');
    }

    return {
      id: invitation.id,
      clientEmail: invitation.clientEmail,
      clientFirstName: invitation.clientFirstName,
      clientLastName: invitation.clientLastName,
      status: invitation.isAccepted ? 'JOINED' : 'PENDING',
      invited: invitation.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${invitation.clientEmail}`,
      createdAt: invitation.createdAt,
    };
  }

  async resendInvitation(practitionerId: string, invitationId: string): Promise<InvitationResponse> {
    const originalInvitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        practitionerId,
      },
    });

    if (!originalInvitation) {
      throw new NotFoundException('Invitation not found or you do not have permission to access it.');
    }

    const { clientEmail, clientFirstName, clientLastName, intakeFormId } = originalInvitation;

    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId },
    });
    if (!practitioner) {
      throw new NotFoundException('Practitioner not found');
    }

    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newInvitation = await this.prisma.invitation.create({
      data: {
        practitionerId,
        clientEmail,
        clientFirstName,
        clientLastName,
        token,
        expiresAt,
        intakeFormId,
      },
    });

    let intakeFormTitle: string | undefined;
    if (intakeFormId) {
      const form = await this.prisma.intakeForm.findUnique({ where: { id: intakeFormId } });
      intakeFormTitle = form?.title;
    }

    try {
      const invitationLink = `${config.frontendUrl}/client/auth/signup?token=${encodeURIComponent(token)}`;

      const practitionerName =
        practitioner.firstName && practitioner.lastName
          ? `${practitioner.firstName} ${practitioner.lastName}`
          : 'Your Practitioner';

      await this.mailService.sendClientInvitation({
        to: clientEmail,
        clientName: `${clientFirstName} ${clientLastName}`,
        practitionerName,
        invitationLink,
        intakeFormTitle,
      });
    } catch {
      await this.prisma.invitation.delete({ where: { id: newInvitation.id } });
      throw new BadRequestException('Failed to resend invitation email');
    }

    return {
      id: newInvitation.id,
      clientEmail: newInvitation.clientEmail,
      clientFirstName: newInvitation.clientFirstName,
      clientLastName: newInvitation.clientLastName,
      status: 'PENDING',
      invited: newInvitation.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${newInvitation.clientEmail}`,
      createdAt: newInvitation.createdAt,
    };
  }

  async getInvitationByToken(token: string) {
    const cleanToken = token.trim();

    let invitation = await this.prisma.invitation.findUnique({
      where: { token: cleanToken },
    });

    if (!invitation) {
      try {
        const decodedToken = decodeURIComponent(cleanToken);
        invitation = await this.prisma.invitation.findUnique({
          where: { token: decodedToken },
        });
      } catch {
        // Token decoding failed, invitation remains null
      }
    }

    const currentTime = new Date();

    if (!invitation) {
      throw new NotFoundException('Invitation not found or has expired.');
    }

    const isExpired = invitation.expiresAt < currentTime;

    if (isExpired) {
      throw new NotFoundException('Invitation not found or has expired.');
    }

    return {
      clientEmail: invitation.clientEmail,
      isAccepted: invitation.isAccepted,
    };
  }

  async getInvitations(practitionerId: string): Promise<InvitationResponse[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        practitionerId,
        isAccepted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      clientEmail: invitation.clientEmail,
      clientFirstName: invitation.clientFirstName,
      clientLastName: invitation.clientLastName,
      status: invitation.isAccepted ? 'JOINED' : 'PENDING',
      invited: invitation.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${invitation.clientEmail}`,
      createdAt: invitation.createdAt,
    }));
  }

  async getClients(practitionerId: string) {
    const clients = await this.prisma.user.findMany({
      where: {
        practitionerId,
        role: 'CLIENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return clients;
  }

  async deleteInvitation(practitionerId: string, invitationId: string) {
    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      throw new NotFoundException('Practitioner not found');
    }

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        practitionerId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.isAccepted) {
      throw new BadRequestException('Cannot delete an invitation that has already been accepted');
    }

    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation deleted successfully' };
  }
}
