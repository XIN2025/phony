import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(practitionerId: string, clientId: string, audioFileUrl?: string) {
    return await this.prisma.session.create({
      data: {
        practitionerId,
        clientId,
        audioFileUrl,
        status: SessionStatus.UPLOADING,
      },
    });
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus, transcript?: string) {
    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status,
        transcript,
      },
    });
  }

  async getSessionsByPractitioner(practitionerId: string) {
    return await this.prisma.session.findMany({
      where: { practitionerId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getSessionsByClient(clientId: string) {
    return await this.prisma.session.findMany({
      where: { clientId },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
          },
        },
        plan: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getSessionById(sessionId: string) {
    return await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: {
          include: {
            actionItems: {
              include: {
                resources: true,
                completions: true,
              },
            },
          },
        },
      },
    });
  }
}
