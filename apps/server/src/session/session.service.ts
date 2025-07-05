import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';
import { TranscriptionService } from '../transcription/transcription.service';

import { AiService } from '@/ai/ai.service';

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

  async addAudioToSession(sessionId: string, audioBuffer: Buffer) {
    if (!audioBuffer) {
      throw new Error('Audio buffer is required');
    }

    if (audioBuffer.byteLength === 0) {
      throw new Error('Audio buffer cannot be empty');
    }

    setTimeout(() => {
      this.transcribeAndUpdateStatus(sessionId, audioBuffer).catch((err) => {
        this.logger.error(`Caught unhandled error in background transcription for session ${sessionId}:`, err.stack);
      });
    }, 0);

    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.TRANSCRIBING,
      },
    });
  }

  private async transcribeAndUpdateStatus(sessionId: string, audioBuffer: Buffer) {
    try {
      this.logger.log(`Starting background transcription for session: ${sessionId}`);

      const result = await this.transcriptionService.transcribeAudioBuffer(audioBuffer, sessionId);

      if (result.transcript) {
        this.logger.log(`Transcription successful for session: ${sessionId}. Starting AI processing.`);

        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript: result.transcript,
            status: SessionStatus.AI_PROCESSING,
          },
        });

        setTimeout(() => {
          this.processWithAI(sessionId, result.transcript!).catch((err) => {
            this.logger.error(`Caught unhandled error in AI processing for session ${sessionId}:`, err.stack);
          });
        }, 0);

        this.logger.log(`Successfully updated session ${sessionId} with transcript and started AI processing.`);
      } else {
        this.logger.error(`Transcription failed for session: ${sessionId}. Audio saved for debugging.`);

        if (result.savedFilePath) {
          await this.prisma.session.update({
            where: { id: sessionId },
            data: {
              audioFileUrl: result.savedFilePath,
              status: SessionStatus.TRANSCRIBING,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`An error occurred in the background transcription process for session ${sessionId}:`, error);
    }
  }

  private async processWithAI(sessionId: string, transcript: string) {
    try {
      this.logger.log(`Starting AI processing for session: ${sessionId}`);

      const aiResults = await this.aiService.processSession(transcript);

      this.logger.log(`AI results received for session ${sessionId}:`, {
        hasFilteredTranscript: !!aiResults.filteredTranscript,
        hasSummary: !!aiResults.summary,
        summaryTitle: aiResults.summary?.title,
        summaryLength: aiResults.summary?.summary?.length,
        actionItemsCount: aiResults.actionItemSuggestions?.suggestions?.length || 0,
      });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          filteredTranscript: aiResults.filteredTranscript,
          aiSummary: aiResults.summary?.summary || 'AI summary generation failed',
          status: SessionStatus.REVIEW_READY,
        },
      });

      if (aiResults.actionItemSuggestions?.suggestions?.length > 0) {
        await this.createSuggestedActionItems(sessionId, aiResults.actionItemSuggestions.suggestions);
      }

      this.logger.log(
        `AI processing completed successfully for session: ${sessionId}. Audio was processed in memory without saving to disk.`
      );
    } catch (error) {
      this.logger.error(`AI processing failed for session: ${sessionId}`, error);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          aiSummary: 'AI processing failed - please try again',
          status: SessionStatus.REVIEW_READY,
        },
      });

      this.logger.log(`AI processing failed for session ${sessionId}, but audio was already processed in memory.`);
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
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { plan: true },
      });

      if (!session) {
        this.logger.error(`Session not found: ${sessionId}`);
        return;
      }

      let planId = session.plan?.id;

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
