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
  status: 'pending' | 'accepted';
  createdAt: Date;
}

@Injectable()
export class PractitionerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async inviteClient(practitionerId: string, inviteData: InviteClientDto): Promise<InvitationResponse> {
    console.log(
      `[PractitionerService] Starting invitation process for ${inviteData.clientEmail} by practitioner ${practitionerId}`
    );
    console.log(`[PractitionerService] Invite DTO:`, inviteData);

    // Normalize email
    const normalizedEmail = inviteData.clientEmail.toLowerCase().trim();
    const normalizedFirstName = inviteData.clientFirstName.trim();
    const normalizedLastName = inviteData.clientLastName.trim();

    // Check if practitioner exists
    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      console.log(`[PractitionerService] Practitioner not found: ${practitionerId}`);
      throw new NotFoundException('Practitioner not found');
    }

    // Check if client already exists
    const existingClient = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        practitionerId,
        role: 'CLIENT',
      },
    });

    if (existingClient) {
      console.log(`[PractitionerService] Client already exists: ${normalizedEmail}`);
      throw new BadRequestException('A client with this email already exists in your practice.');
    }

    // Check if there's already an invitation for this practitioner and email
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        practitionerId,
        clientEmail: normalizedEmail,
      },
    });

    if (existingInvitation) {
      console.log(`[PractitionerService] Invitation already exists for ${normalizedEmail}, updating...`);

      // Check if the existing invitation is still valid (not expired)
      const currentTime = new Date();
      if (existingInvitation.expiresAt > currentTime && !existingInvitation.isAccepted) {
        throw new BadRequestException(
          'An invitation has already been sent to this email address and is still pending.'
        );
      }

      // If expired or accepted, we can create a new invitation by deleting the old one
      await this.prisma.invitation.delete({
        where: { id: existingInvitation.id },
      });
      console.log(`[PractitionerService] Deleted expired/accepted invitation for ${normalizedEmail}`);
    }

    // Validate intake form if provided
    const { intakeFormId } = inviteData;
    let intakeFormTitle: string | undefined;

    if (intakeFormId) {
      const form = await this.prisma.intakeForm.findFirst({
        where: { id: intakeFormId, practitionerId },
      });
      if (!form) {
        console.log(`[PractitionerService] Intake form not found or doesn't belong to practitioner: ${intakeFormId}`);
        throw new BadRequestException('The selected intake form does not exist or does not belong to you.');
      }
      intakeFormTitle = form.title;
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    console.log(
      `[PractitionerService] Creating invitation for ${normalizedEmail} with new token: ${token.substring(0, 8)}...`
    );

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        practitionerId,
        clientEmail: normalizedEmail,
        token,
        expiresAt,
        intakeFormId,
      },
    });

    console.log(`[PractitionerService] Invitation created in DB with ID: ${invitation.id}`);

    // Send invitation email
    try {
      const invitationLink = `${config.frontendUrl}/client/auth/signup?token=${encodeURIComponent(token)}`;
      console.log(`[PractitionerService] Attempting to send email to ${normalizedEmail} with link: ${invitationLink}`);

      const emailSent = await this.mailService.sendClientInvitation({
        to: normalizedEmail,
        clientName: `${normalizedFirstName} ${normalizedLastName}`,
        practitionerName: practitioner.name || 'Your Practitioner',
        invitationLink: invitationLink,
        intakeFormTitle,
      });

      if (!emailSent) {
        console.error(`[PractitionerService] Email service returned false for ${normalizedEmail}`);
        // If email fails, delete the invitation
        await this.prisma.invitation.delete({
          where: { id: invitation.id },
        });
        throw new BadRequestException('Failed to send invitation email');
      }

      console.log(`[PractitionerService] Email sent successfully to ${normalizedEmail}`);
    } catch (error) {
      console.error(`[PractitionerService] Email sending failed for ${normalizedEmail}:`, error);
      // If email fails, delete the invitation
      await this.prisma.invitation.delete({
        where: { id: invitation.id },
      });
      throw new BadRequestException('Failed to send invitation email');
    }

    return {
      id: invitation.id,
      clientEmail: invitation.clientEmail,
      status: invitation.isAccepted ? 'accepted' : 'pending',
      createdAt: invitation.createdAt,
    };
  }

  async getInvitationByToken(token: string) {
    console.log(`[PractitionerService] Validating token: ${token.substring(0, 8)}...`);
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    const currentTime = new Date();

    if (!invitation) {
      console.error(`[PractitionerService] Invitation not found for token: ${token.substring(0, 8)}...`);
      throw new NotFoundException('Invitation not found or has expired.');
    }

    const isExpired = invitation.expiresAt < currentTime;

    console.log('[PractitionerService] Found invitation:', {
      found: true,
      isAccepted: invitation.isAccepted,
      expiresAt: invitation.expiresAt,
      expiresAtISO: invitation.expiresAt.toISOString(),
      currentTime: currentTime,
      currentTimeISO: currentTime.toISOString(),
      isExpired: isExpired,
      timeDifference: invitation.expiresAt.getTime() - currentTime.getTime(),
      timeDifferenceHours: (invitation.expiresAt.getTime() - currentTime.getTime()) / (1000 * 3600),
      timeDifferenceDays: (invitation.expiresAt.getTime() - currentTime.getTime()) / (1000 * 3600 * 24),
    });

    if (isExpired) {
      console.error(`[PractitionerService] Invitation is expired for token: ${token.substring(0, 8)}...`);
      throw new NotFoundException('Invitation not found or has expired.');
    }

    console.log('[PractitionerService] Invitation is valid');

    return {
      clientEmail: invitation.clientEmail,
      isAccepted: invitation.isAccepted,
    };
  }

  async debugInvitationToken(token: string) {
    console.log(`[PractitionerService] Debugging token: ${token.substring(0, 8)}...`);

    // Try to find the invitation with the exact token
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    // Also try to find any invitation that might be similar
    const allInvitations = await this.prisma.invitation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const debugInfo = {
      token: token.substring(0, 8) + '...',
      tokenLength: token.length,
      foundExactMatch: !!invitation,
      invitationDetails: invitation
        ? {
            id: invitation.id,
            clientEmail: invitation.clientEmail,
            isAccepted: invitation.isAccepted,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            tokenStart: invitation.token.substring(0, 8) + '...',
            tokenLength: invitation.token.length,
          }
        : null,
      currentTime: new Date(),
      recentInvitations: allInvitations.map((inv) => ({
        id: inv.id,
        clientEmail: inv.clientEmail,
        tokenStart: inv.token.substring(0, 8) + '...',
        isAccepted: inv.isAccepted,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };

    console.log(`[PractitionerService] Debug info:`, debugInfo);
    return debugInfo;
  }

  async getInvitations(practitionerId: string): Promise<InvitationResponse[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: { practitionerId },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      clientEmail: invitation.clientEmail,
      status: invitation.isAccepted ? 'accepted' : 'pending',
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
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return clients;
  }

  async deleteInvitation(practitionerId: string, invitationId: string) {
    console.log(
      `[PractitionerService] Attempting to delete invitation ${invitationId} for practitioner ${practitionerId}`
    );

    // Check if practitioner exists
    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      console.log(`[PractitionerService] Practitioner not found: ${practitionerId}`);
      throw new NotFoundException('Practitioner not found');
    }

    // Find the invitation and verify it belongs to this practitioner
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        practitionerId,
      },
    });

    if (!invitation) {
      console.log(`[PractitionerService] Invitation not found or doesn't belong to practitioner: ${invitationId}`);
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation has already been accepted
    if (invitation.isAccepted) {
      console.log(`[PractitionerService] Cannot delete accepted invitation: ${invitationId}`);
      throw new BadRequestException('Cannot delete an invitation that has already been accepted');
    }

    // Delete the invitation
    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    console.log(`[PractitionerService] Successfully deleted invitation ${invitationId}`);

    return { message: 'Invitation deleted successfully' };
  }
}
