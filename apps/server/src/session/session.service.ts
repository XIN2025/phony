import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';
import { TranscriptionService } from '../transcription/transcription.service';
import { AiService } from '../ai/ai.service';
import * as path from 'path';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionService,
    private aiService: AiService
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

  async updateSessionStatus(sessionId: string, status: SessionStatus, transcript?: string) {
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
        this.logger.log(`Transcription successful for session: ${sessionId}. Starting AI processing.`);

        // Update status to AI_PROCESSING
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript,
            status: SessionStatus.AI_PROCESSING,
          },
        });

        // Start AI processing in background
        setTimeout(() => {
          this.processWithAI(sessionId, transcript).catch((err) => {
            this.logger.error(`Caught unhandled error in AI processing for session ${sessionId}:`, err.stack);
          });
        }, 0);

        this.logger.log(`Successfully updated session ${sessionId} with transcript and started AI processing.`);
      } else {
        this.logger.error(`Transcription failed for session: ${sessionId}. Status will remain TRANSCRIBING.`);
      }
    } catch (error) {
      this.logger.error(`An error occurred in the background transcription process for session ${sessionId}:`, error);
    }
  }

  private async processWithAI(sessionId: string, transcript: string) {
    try {
      this.logger.log(`Starting AI processing for session: ${sessionId}`);

      // Run AI processing pipeline
      const aiResults = await this.aiService.processSession(transcript);

      // Update session with AI results
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          filteredTranscript: aiResults.filteredTranscript,
          aiSummary: aiResults.summary.summary,
          status: SessionStatus.REVIEW_READY,
        },
      });

      // Create suggested action items if any
      if (aiResults.actionItemSuggestions.suggestions.length > 0) {
        await this.createSuggestedActionItems(sessionId, aiResults.actionItemSuggestions.suggestions);
      }

      this.logger.log(`AI processing completed successfully for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`AI processing failed for session: ${sessionId}`, error);

      // Fall back to REVIEW_READY status even if AI processing fails
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.REVIEW_READY,
        },
      });
    }
  }

  private async createSuggestedActionItems(
    sessionId: string,
    suggestions: Array<{
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
    }>
  ) {
    try {
      // Get session details to create plan if needed
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { plan: true },
      });

      if (!session) {
        this.logger.error(`Session not found: ${sessionId}`);
        return;
      }

      let planId = session.plan?.id;

      // Create plan if it doesn't exist
      if (!planId) {
        const newPlan = await this.prisma.plan.create({
          data: {
            sessionId: sessionId,
            practitionerId: session.practitionerId,
            clientId: session.clientId,
          },
        });
        planId = newPlan.id;
      }

      // Create suggested action items
      const suggestedItems = suggestions.map((suggestion) => ({
        planId: planId,
        description: suggestion.description,
        category: suggestion.category,
        target: suggestion.target,
        frequency: suggestion.frequency,
      }));

      await this.prisma.suggestedActionItem.createMany({
        data: suggestedItems,
      });

      this.logger.log(`Created ${suggestions.length} suggested action items for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to create suggested action items for session: ${sessionId}`, error);
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
