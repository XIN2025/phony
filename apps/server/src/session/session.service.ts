import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';
import { TranscriptionService } from '../transcription/transcription.service';
import { AiService } from '@/ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionService,
    private aiService: AiService
  ) {}

  async createSession(practitionerId: string, clientId: string, title: string, notes?: string, summary?: string) {
    return await this.prisma.session.create({
      data: {
        practitionerId,
        clientId,
        title,
        notes,
        aiSummary: summary,
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

  async addAudioToSession(sessionId: string, audioBuffer: Buffer, durationSeconds?: number) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw new Error('Session ID is required');
      }

      if (!audioBuffer) {
        throw new Error('Audio buffer is required');
      }

      if (audioBuffer.byteLength === 0) {
        throw new Error('Audio buffer cannot be empty');
      }

      // Check if session exists first
      const existingSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      // Always save the audio file to disk
      const audioFileUrl = this.saveAudioFile(audioBuffer, sessionId);

      // Update session with audio file URL, duration, and set status to TRANSCRIBING
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          audioFileUrl,
          ...(durationSeconds !== undefined && { durationSeconds }),
          status: SessionStatus.TRANSCRIBING,
        },
      });

      // Start transcription in background
      setTimeout(() => {
        this.transcribeAndUpdateStatus(sessionId, audioFileUrl).catch((err) => {
          this.logger.error(`Caught unhandled error in background transcription for session ${sessionId}:`, err.stack);
        });
      }, 0);

      return session;
    } catch (error) {
      this.logger.error(`Error in addAudioToSession for session ${sessionId}:`, error);
      throw error;
    }
  }

  private saveAudioFile(audioBuffer: Buffer, sessionId: string): string {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `session_${sessionId}_${Date.now()}.webm`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, audioBuffer);

      this.logger.log(`Audio file saved successfully: ${filePath}`);
      return `/uploads/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to save audio file for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async transcribeAndUpdateStatus(sessionId: string, audioFileUrl: string) {
    try {
      this.logger.log(`Starting background transcription for session: ${sessionId}`);
      const fullFilePath = path.join(process.cwd(), 'uploads', path.basename(audioFileUrl));
      const transcript = await this.transcriptionService.transcribeAudio(fullFilePath);

      if (transcript && transcript.trim().length > 0) {
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
        this.logger.error(
          `Transcription failed or returned empty for session: ${sessionId}. Marking as TRANSCRIPTION_FAILED.`
        );
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript: '',
            filteredTranscript: '',
            aiSummary: 'Transcription failed. No audio or no speech detected.',
            status: SessionStatus.TRANSCRIPTION_FAILED,
          },
        });
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

      this.logger.log(`AI processing completed successfully for session: ${sessionId}. Audio file saved to disk.`);
    } catch (error) {
      this.logger.error(`AI processing failed for session: ${sessionId}`, error);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          aiSummary: 'AI processing failed - please try again',
          status: SessionStatus.REVIEW_READY,
        },
      });

      this.logger.log(`AI processing failed for session ${sessionId}, but audio file was saved to disk.`);
    }
  }

  private async createSuggestedActionItems(
    sessionId: string,
    suggestions: Array<{
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
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
        weeklyRepetitions: suggestion.weeklyRepetitions || 1,
        isMandatory: suggestion.isMandatory || false,
        whyImportant: suggestion.whyImportant,
        recommendedActions: suggestion.recommendedActions,
        toolsToHelp: suggestion.toolsToHelp,
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
