import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@repo/db';
import { TranscriptionService } from '../transcription/transcription.service';
import { AiService } from '@/ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

function normalizeToolsToHelp(toolsToHelp: unknown): string | undefined {
  if (!toolsToHelp) return undefined;
  if (typeof toolsToHelp === 'string') return toolsToHelp;
  if (Array.isArray(toolsToHelp)) {
    return toolsToHelp
      .map((tool) =>
        tool.link ? `${tool.name} (${tool.whatItEnables}) - ${tool.link}` : `${tool.name} (${tool.whatItEnables})`
      )
      .join('\n');
  }
  return undefined;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionService,
    private aiService: AiService
  ) {}

  async createSession(practitionerId: string, clientId: string, title: string, notes?: string, summaryTitle?: string) {
    return await this.prisma.session.create({
      data: {
        practitionerId,
        clientId,
        title,
        notes,
        summaryTitle,
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

      const existingSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      const audioFileUrl = this.saveAudioFile(audioBuffer, sessionId);

      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          audioFileUrl,
          ...(durationSeconds !== undefined && { durationSeconds }),
          status: SessionStatus.TRANSCRIBING,
        },
      });

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

      return `/uploads/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to save audio file for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async transcribeAndUpdateStatus(sessionId: string, audioFileUrl: string) {
    try {
      const fullFilePath = path.join(process.cwd(), 'uploads', path.basename(audioFileUrl));
      const transcript = await this.transcriptionService.transcribeAudio(fullFilePath);

      if (transcript && transcript.trim().length > 0) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript,
            status: SessionStatus.AI_PROCESSING,
          },
        });

        setTimeout(() => {
          this.processWithAI(sessionId, transcript).catch((err) => {
            this.logger.error(`Caught unhandled error in AI processing for session ${sessionId}:`, err.stack);
          });
        }, 0);
      } else {
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
      const aiResults = await this.aiService.processSession(transcript);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          filteredTranscript: aiResults.filteredTranscript || transcript,
          aiSummary: aiResults.summary?.summary || 'AI summary generation failed',
          summaryTitle: aiResults.summary?.title || null,
          status: SessionStatus.REVIEW_READY,
        },
      });

      if (aiResults.actionItemSuggestions?.complementaryTasks?.length > 0) {
        const normalizedSuggestions = aiResults.actionItemSuggestions.complementaryTasks.map((suggestion) => ({
          ...suggestion,
          toolsToHelp: normalizeToolsToHelp(suggestion.toolsToHelp),
        }));
        await this.createSuggestedActionItems(sessionId, normalizedSuggestions);
      }
    } catch (error) {
      this.logger.error(`Unexpected error in AI processing for session: ${sessionId}`, error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      });

      try {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            filteredTranscript: transcript,
            aiSummary: `AI processing failed - ${error.message || 'Unknown error'}`,
            status: SessionStatus.REVIEW_READY,
          },
        });
      } catch (updateError) {
        this.logger.error(`Failed to update session ${sessionId} after AI processing error:`, updateError);
      }
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

      if (!session.plan) {
        return;
      }

      const suggestedItems = suggestions.map((suggestion) => ({
        planId: session.plan!.id,
        description: suggestion.description,
        category: suggestion.category,
        target: suggestion.target,
        frequency: suggestion.frequency,
        weeklyRepetitions: suggestion.weeklyRepetitions || 1,
        isMandatory: suggestion.isMandatory || false,
        whyImportant: suggestion.whyImportant,
        recommendedActions: suggestion.recommendedActions,
        toolsToHelp: normalizeToolsToHelp(suggestion.toolsToHelp),
      }));

      await this.prisma.suggestedActionItem.createMany({
        data: suggestedItems,
      });
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
          durationSeconds: true,
          plan: {
            select: {
              id: true,
              status: true,
              publishedAt: true,
              sessionId: true,
              actionItems: {
                select: {
                  id: true,
                  description: true,
                  target: true,
                  frequency: true,
                  category: true,
                  weeklyRepetitions: true,
                  isMandatory: true,
                  whyImportant: true,
                  recommendedActions: true,
                  toolsToHelp: true,
                  source: true,
                  daysOfWeek: true,
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

  async updateSession(sessionId: string, data: { aiSummary?: string; notes?: string; summaryTitle?: string }) {
    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.summaryTitle !== undefined ? { summaryTitle: data.summaryTitle } : {}),
      },
    });
  }
}
