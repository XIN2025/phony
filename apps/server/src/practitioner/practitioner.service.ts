import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { config } from '../common/config';
import { InviteClientDto, InvitationResponse } from '@repo/shared-types/schemas';
import {
  normalizeEmail,
  getPractitionerName,
  getIntakeFormTitle,
  formatDate,
  throwAuthError,
  validateRequiredFields,
  getAvatarUrl,
} from 'src/common/utils/user.utils';
import { UserRole, InvitationStatus } from '@repo/db';

export { InviteClientDto };

@Injectable()
export class PractitionerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService
  ) {}

  async inviteClient(practitionerId: string, inviteData: InviteClientDto): Promise<InvitationResponse> {
    validateRequiredFields(inviteData as unknown as Record<string, unknown>, ['clientFirstName', 'clientEmail']);
    const { clientFirstName, clientLastName, clientEmail, intakeFormId } = inviteData;
    const normalizedEmail = normalizeEmail(clientEmail);
    const normalizedFirstName = clientFirstName.trim();
    const normalizedLastName = clientLastName?.trim();

    const practitioner = await this.prismaService.user.findUnique({ where: { id: practitionerId } });
    if (!practitioner) throwAuthError('Practitioner not found', 'notFound');
    const existingUser = await this.prismaService.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throwAuthError('A user with this email already exists', 'badRequest');
    const existingInvitation = await this.prismaService.invitation.findFirst({
      where: { practitionerId, clientEmail: normalizedEmail },
    });
    let invitation;
    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.ACCEPTED)
        throwAuthError('This client has already been invited and accepted the invitation', 'badRequest');
      invitation = await this.prismaService.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          clientFirstName: normalizedFirstName,
          clientLastName: normalizedLastName,
          intakeFormId,
          token: `${normalizedEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: InvitationStatus.PENDING,
        },
      });
    } else {
      invitation = await this.prismaService.invitation.create({
        data: {
          practitionerId,
          clientEmail: normalizedEmail,
          clientFirstName: normalizedFirstName,
          clientLastName: normalizedLastName,
          token: `${normalizedEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          intakeFormId,
        },
      });
    }

    let intakeFormTitle: string | undefined;
    if (intakeFormId) {
      const form = await this.prismaService.intakeForm.findUnique({
        where: { id: intakeFormId },
        select: { title: true },
      });
      intakeFormTitle = form ? getIntakeFormTitle(form) : undefined;
    }

    await this.sendInvitationEmail(
      invitation,
      practitioner,
      normalizedEmail,
      normalizedFirstName,
      normalizedLastName,
      intakeFormTitle
    );
    return {
      id: invitation.id,
      clientEmail: invitation.clientEmail,
      clientFirstName: invitation.clientFirstName,
      clientLastName: invitation.clientLastName,
      status: invitation.status === InvitationStatus.ACCEPTED ? 'JOINED' : 'PENDING',
      invited: formatDate(invitation.createdAt),
      createdAt: invitation.createdAt,
      avatar: getAvatarUrl({
        firstName: invitation.clientFirstName,
        lastName: invitation.clientLastName,
      }),
    };
  }

  async resendInvitation(practitionerId: string, invitationId: string): Promise<InvitationResponse> {
    const originalInvitation = await this.prismaService.invitation.findFirst({
      where: { id: invitationId, practitionerId },
    });

    if (!originalInvitation)
      throwAuthError('Invitation not found or you do not have permission to access it.', 'notFound');
    const { clientEmail, clientFirstName, clientLastName, intakeFormId } = originalInvitation;
    const practitioner = await this.prismaService.user.findUnique({ where: { id: practitionerId } });
    if (!practitioner) throwAuthError('Practitioner not found', 'notFound');

    await this.prismaService.invitation.delete({ where: { id: invitationId } });
    const token = `${clientEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newInvitation = await this.prismaService.invitation.create({
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
      const form = await this.prismaService.intakeForm.findUnique({
        where: { id: intakeFormId },
        select: { title: true },
      });
      intakeFormTitle = form ? getIntakeFormTitle(form) : undefined;
    }

    try {
      await this.sendInvitationEmail(
        newInvitation,
        practitioner,
        clientEmail,
        clientFirstName,
        clientLastName,
        intakeFormTitle
      );
    } catch {
      await this.prismaService.invitation.delete({ where: { id: newInvitation.id } });
      throwAuthError('Failed to resend invitation email', 'badRequest');
    }
    return {
      id: newInvitation.id,
      clientEmail: newInvitation.clientEmail,
      clientFirstName: newInvitation.clientFirstName,
      clientLastName: newInvitation.clientLastName,
      status: newInvitation.status === InvitationStatus.ACCEPTED ? 'JOINED' : 'PENDING',
      invited: formatDate(newInvitation.createdAt),
      createdAt: newInvitation.createdAt,
      avatar: getAvatarUrl({
        firstName: newInvitation.clientFirstName,
        lastName: newInvitation.clientLastName || '',
      }),
    };
  }

  private async sendInvitationEmail(
    invitation: { token: string },
    practitioner: { firstName: string; lastName?: string | null; profession?: string | null },
    email: string,
    firstName: string,
    lastName?: string | null,
    intakeFormTitle?: string
  ): Promise<void> {
    const invitationLink = `${config.frontendUrl}/client/auth/signup?token=${encodeURIComponent(invitation.token)}`;
    const practitionerName = getPractitionerName(practitioner);
    const clientName = `${firstName} ${lastName || ''}`.trim();

    const emailSent = await this.mailService.sendClientInvitation({
      to: email,
      clientName,
      practitionerName,
      invitationLink,
      intakeFormTitle,
    });

    if (!emailSent) throwAuthError('Failed to send invitation email', 'badRequest');
  }

  async getInvitationByToken(token: string) {
    const cleanToken = token.trim();
    let invitation = await this.prismaService.invitation.findUnique({ where: { token: cleanToken } });
    if (!invitation) {
      const decodedToken = Buffer.from(cleanToken, 'base64').toString('utf-8');
      invitation = await this.prismaService.invitation.findUnique({ where: { token: decodedToken } });
    }
    const currentTime = new Date();
    if (!invitation) throwAuthError('Invitation not found or has expired.', 'notFound');
    const isExpired = invitation.expiresAt < currentTime;
    if (isExpired) throwAuthError('Invitation not found or has expired.', 'notFound');
    return {
      clientEmail: invitation.clientEmail,
      isAccepted: invitation.status === InvitationStatus.ACCEPTED,
    };
  }

  async getClients(practitionerId: string) {
    const clients = await this.prismaService.user.findMany({
      where: {
        practitionerId: practitionerId,
        role: UserRole.CLIENT,
      },
      include: {
        _count: {
          select: { intakeFormSubmissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => ({
      id: client.id,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      clientStatus: client.clientStatus,
      avatarUrl: client.avatarUrl,
      createdAt: client.createdAt,
      hasCompletedIntake: client._count.intakeFormSubmissions > 0,
    }));
  }

  async deleteInvitation(practitionerId: string, invitationId: string) {
    const invitation = await this.prismaService.invitation.findFirst({
      where: { id: invitationId, practitionerId },
    });

    if (!invitation) {
      throwAuthError('Invitation not found or you do not have permission to delete it.', 'notFound');
    }

    await this.prismaService.invitation.delete({ where: { id: invitationId } });
    return { message: 'Invitation deleted successfully' };
  }

  async cleanupExpiredInvitations(practitionerId: string) {
    const currentTime = new Date();

    // Update expired invitations to EXPIRED status
    await this.prismaService.invitation.updateMany({
      where: {
        practitionerId,
        expiresAt: { lt: currentTime },
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    });

    // Optionally delete very old expired invitations (older than 30 days)
    const thirtyDaysAgo = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
    await this.prismaService.invitation.deleteMany({
      where: {
        practitionerId,
        status: InvitationStatus.EXPIRED,
        expiresAt: { lt: thirtyDaysAgo },
      },
    });

    return { message: 'Expired invitations cleaned up successfully' };
  }

  async getInvitations(practitionerId: string) {
    const invitations = await this.prismaService.invitation.findMany({
      where: {
        practitionerId: practitionerId,
      },
      include: {
        intakeForm: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentTime = new Date();

    return invitations
      .map((invitation) => {
        const avatar = getAvatarUrl({
          firstName: invitation.clientFirstName,
          lastName: invitation.clientLastName,
        });

        // Check if invitation is expired
        const isExpired = invitation.expiresAt < currentTime;

        // If expired and still PENDING, update status to EXPIRED in database
        if (isExpired && invitation.status === InvitationStatus.PENDING) {
          // Fire and forget - update the status in the background
          this.prismaService.invitation
            .update({
              where: { id: invitation.id },
              data: { status: InvitationStatus.EXPIRED },
            })
            .catch(() => {
              // Ignore errors for this background update
            });
        }

        let status: 'PENDING' | 'JOINED' | 'EXPIRED';
        if (invitation.status === InvitationStatus.ACCEPTED) {
          status = 'JOINED';
        } else if (isExpired || invitation.status === InvitationStatus.EXPIRED) {
          // Don't return expired invitations
          return null;
        } else {
          status = 'PENDING';
        }

        return {
          id: invitation.id,
          clientEmail: invitation.clientEmail,
          clientFirstName: invitation.clientFirstName,
          clientLastName: invitation.clientLastName,
          status,
          invited: formatDate(invitation.createdAt),
          expiresAt: formatDate(invitation.expiresAt),
          intakeFormTitle: invitation.intakeForm ? getIntakeFormTitle(invitation.intakeForm) : undefined,
          avatar: avatar,
        };
      })
      .filter((invitation) => invitation !== null); // Remove expired invitations
  }

  async getIntakeFormSubmissions(practitionerId: string, formId: string) {
    const form = await this.prismaService.intakeForm.findFirst({
      where: {
        id: formId,
        practitionerId: practitionerId,
      },
    });

    if (!form) {
      throwAuthError('Intake form not found', 'notFound');
    }

    const submissions = await this.prismaService.intakeFormSubmission.findMany({
      where: {
        formId: formId,
      },
      include: {
        client: true,
        answers: {
          include: {
            submission: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      client: {
        id: submission.client.id,
        firstName: submission.client.firstName,
        lastName: submission.client.lastName,
        email: submission.client.email,
      },
      submittedAt: submission.submittedAt,
      answers: submission.answers.map((answer) => ({
        questionText: answer.questionId,
        questionType: 'UNKNOWN',
        answer: answer.value,
      })),
    }));
  }
}
