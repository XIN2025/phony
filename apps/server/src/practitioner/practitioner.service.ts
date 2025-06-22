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
    console.log(`[PractitionerService] Generated token length: ${token.length}`);
    console.log(`[PractitionerService] Full generated token: ${token}`);

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
    console.log(`[PractitionerService] Stored token in DB: ${invitation.token.substring(0, 8)}...`);

    // Send invitation email
    try {
      const invitationLink = `${config.frontendUrl}/client/auth/signup?token=${encodeURIComponent(token)}`;
      console.log(`[PractitionerService] Attempting to send email to ${normalizedEmail} with link: ${invitationLink}`);
      console.log(`[PractitionerService] Encoded token in URL: ${encodeURIComponent(token)}`);

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
    console.log(`[PractitionerService] Token length: ${token.length}`);
    console.log(`[PractitionerService] Full token: ${token}`);

    // Clean the token - remove any potential URL encoding issues
    const cleanToken = token.trim();

    // Try to find the invitation with the exact token
    let invitation = await this.prisma.invitation.findUnique({
      where: { token: cleanToken },
    });

    // If not found, try with URL decoded version
    if (!invitation) {
      try {
        const decodedToken = decodeURIComponent(cleanToken);
        console.log(`[PractitionerService] Trying decoded token: ${decodedToken.substring(0, 8)}...`);
        invitation = await this.prisma.invitation.findUnique({
          where: { token: decodedToken },
        });
      } catch (error) {
        console.log(`[PractitionerService] URL decode failed:`, error);
      }
    }

    // If still not found, try to find by partial match (for debugging)
    if (!invitation) {
      console.log(`[PractitionerService] Token not found, searching for partial matches...`);
      const allInvitations = await this.prisma.invitation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        `[PractitionerService] Recent invitations:`,
        allInvitations.map((inv) => ({
          id: inv.id,
          clientEmail: inv.clientEmail,
          tokenStart: inv.token.substring(0, 8),
          tokenLength: inv.token.length,
          createdAt: inv.createdAt,
          isAccepted: inv.isAccepted,
          expiresAt: inv.expiresAt,
        }))
      );
    }

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
    console.log(`[PractitionerService] Debug token length: ${token.length}`);
    console.log(`[PractitionerService] Debug full token: ${token}`);

    // Try different token variations
    const tokenVariations = [
      token,
      token.trim(),
      decodeURIComponent(token.trim()),
      token.replace(/\+/g, ' '), // Handle plus signs that might be URL encoded spaces
    ];

    console.log(
      `[PractitionerService] Testing token variations:`,
      tokenVariations.map((t) => ({
        token: t.substring(0, 8) + '...',
        length: t.length,
        isHex: /^[0-9a-fA-F]+$/.test(t),
      }))
    );

    // Try to find the invitation with each token variation
    let foundInvitation: {
      id: string;
      clientEmail: string;
      isAccepted: boolean;
      expiresAt: Date;
      createdAt: Date;
      token: string;
    } | null = null;
    for (const tokenVar of tokenVariations) {
      try {
        const invitation = await this.prisma.invitation.findUnique({
          where: { token: tokenVar },
        });
        if (invitation) {
          foundInvitation = invitation;
          console.log(`[PractitionerService] Found invitation with token variation: ${tokenVar.substring(0, 8)}...`);
          break;
        }
      } catch (error) {
        console.log(`[PractitionerService] Error testing token variation:`, error);
      }
    }

    // Also try to find any invitation that might be similar
    const allInvitations = await this.prisma.invitation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const debugInfo = {
      token: token.substring(0, 8) + '...',
      tokenLength: token.length,
      foundExactMatch: !!foundInvitation,
      invitationDetails: foundInvitation
        ? {
            id: foundInvitation.id,
            clientEmail: foundInvitation.clientEmail,
            isAccepted: foundInvitation.isAccepted,
            expiresAt: foundInvitation.expiresAt,
            createdAt: foundInvitation.createdAt,
            tokenStart: foundInvitation.token.substring(0, 8) + '...',
            tokenLength: foundInvitation.token.length,
          }
        : null,
      currentTime: new Date(),
      tokenVariations: tokenVariations.map((t) => ({
        token: t.substring(0, 8) + '...',
        length: t.length,
        isHex: /^[0-9a-fA-F]+$/.test(t),
      })),
      recentInvitations: allInvitations.map((inv) => ({
        id: inv.id,
        clientEmail: inv.clientEmail,
        tokenStart: inv.token.substring(0, 8) + '...',
        tokenLength: inv.token.length,
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
