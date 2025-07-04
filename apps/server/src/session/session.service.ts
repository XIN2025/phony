import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';
import { TranscriptionService } from '../transcription/transcription.service';
import * as path from 'path';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionService
  ) {}

  async createSession(practitionerId: string, clientId: string, title: string, notes?: string) {
    return await this.prisma.session.create({
      data: {
        practitionerId,
        clientId,
        title,
        notes,
        status: SessionStatus.UPLOADING,
      },
    });
  }

  async updateSessionStatus(
    sessionId: string,
    status: (typeof SessionStatus)[keyof typeof SessionStatus],
    transcript?: string
  ) {
    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status,
        transcript,
      },
    });
  }

  async addAudioToSession(sessionId: string, audioFileUrl: string) {
    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        audioFileUrl,
        status: SessionStatus.TRANSCRIBING,
      },
    });

    setTimeout(() => {
      this.transcribeAndUpdateStatus(sessionId, audioFileUrl).catch((err) => {
        this.logger.error(`Caught unhandled error in background transcription for session ${sessionId}:`, err.stack);
      });
    }, 0);

    return session;
  }

  private async transcribeAndUpdateStatus(sessionId: string, audioFileUrl: string) {
    try {
      this.logger.log(`Starting background transcription for session: ${sessionId}`);
      const fullFilePath = path.join(process.cwd(), 'uploads', path.basename(audioFileUrl));
      const transcript = await this.transcriptionService.transcribeAudio(fullFilePath);

      if (transcript) {
        this.logger.log(`Transcription successful for session: ${sessionId}. Updating status to REVIEW_READY.`);
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript,
            status: SessionStatus.REVIEW_READY,
          },
        });
        this.logger.log(`Successfully updated session ${sessionId} with transcript and new status.`);
      } else {
        this.logger.error(`Transcription failed for session: ${sessionId}. Status will remain TRANSCRIBING.`);
      }
    } catch (error) {
      this.logger.error(`An error occurred in the background transcription process for session ${sessionId}:`, error);
    }
  }

  async getSessionsByPractitioner(practitionerId: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { practitionerId },
        select: {
          id: true,
          recordedAt: true,
          status: true,
          title: true,
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          plan: { select: { actionItems: { select: { id: true } } } },
        },
        orderBy: { recordedAt: 'desc' },
      });
      return sessions;
    } catch (error) {
      this.logger.error(`Error fetching sessions for practitioner ${practitionerId}:`, error.stack);
      throw error;
    }
  }

  async getSessionsByClient(clientId: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { clientId },
        select: {
          id: true,
          recordedAt: true,
          status: true,
          title: true,
          plan: {
            select: {
              actionItems: {
                select: {
                  id: true,
                  description: true,
                  target: true,
                  frequency: true,
                  completions: { select: { id: true } },
                  resources: { select: { title: true, url: true, type: true } },
                },
              },
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
      });
      return sessions;
    } catch (error) {
      this.logger.error(`Error fetching sessions for client ${clientId}:`, error.stack);
      throw error;
    }
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
