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
    // Ensure transcript is plain text, not JSON
    let safeTranscript = transcript;
    if (safeTranscript && safeTranscript.trim().length > 0) {
      try {
        const parsed = JSON.parse(safeTranscript);
        if (typeof parsed === 'object') {
          safeTranscript = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join('\n');
        }
      } catch {
        // Not JSON, do nothing
      }
    }
    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status,
        transcript: safeTranscript,
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

      this.logger.log(`Starting transcription for session ${sessionId}`);
      this.logger.log(`Audio file path: ${fullFilePath}`);

      // Check if file exists and get its size
      if (fs.existsSync(fullFilePath)) {
        const stats = fs.statSync(fullFilePath);
        this.logger.log(`Audio file size: ${stats.size} bytes`);
      } else {
        this.logger.error(`Audio file does not exist: ${fullFilePath}`);
      }

      let transcript = await this.transcriptionService.transcribeAudio(fullFilePath);

      // Ensure transcript is plain text, not JSON
      if (transcript && transcript.trim().length > 0) {
        try {
          const parsed = JSON.parse(transcript);
          if (typeof parsed === 'object') {
            transcript = Object.entries(parsed)
              .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
              .join('\n');
          }
        } catch {
          // Not JSON, do nothing
        }
      }

      if (transcript && transcript.trim().length > 0) {
        this.logger.log(
          `Transcription successful for session ${sessionId}. Transcript length: ${transcript.length} characters`
        );
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
        this.logger.error(`Transcription failed for session ${sessionId}. No transcript generated.`);
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
      this.logger.error(`Error stack:`, error.stack);

      // Update session status to failed
      try {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            transcript: '',
            filteredTranscript: '',
            aiSummary: `Transcription failed: ${error.message || 'Unknown error'}`,
            status: SessionStatus.TRANSCRIPTION_FAILED,
          },
        });
      } catch (updateError) {
        this.logger.error(`Failed to update session status after transcription error:`, updateError);
      }
    }
  }

  private async processWithAI(sessionId: string, transcript: string) {
    try {
      const aiResults = await this.aiService.processSessionWithAllTemplates(transcript);

      const updateData = {
        filteredTranscript: aiResults.filteredTranscript || transcript,
        aiSummary: aiResults.defaultSummary?.summary || 'AI summary generation failed',
        summaryTitle: aiResults.defaultSummary?.title || null,
        soapSummary: aiResults.soapSummary?.summary || null,
        birpSummary: aiResults.birpSummary?.summary || null,
        girpSummary: aiResults.girpSummary?.summary || null,
        piecSummary: aiResults.piecSummary?.summary || null,
        status: SessionStatus.REVIEW_READY,
      };

      await this.prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      if (aiResults.actionItemSuggestions?.complementaryTasks?.length > 0) {
        const normalizedSuggestions = aiResults.actionItemSuggestions.complementaryTasks.map((suggestion) => ({
          ...suggestion,
          weeklyRepetitions:
            typeof suggestion.weeklyRepetitions === 'string'
              ? parseInt(suggestion.weeklyRepetitions, 10) || 1
              : suggestion.weeklyRepetitions || 1,
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
    const session = await this.prisma.session.findUnique({
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

    return session;
  }

  async updateSession(
    sessionId: string,
    data: { aiSummary?: string; notes?: string; summaryTitle?: string; summaryTemplate?: string }
  ) {
    const result = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.summaryTitle !== undefined ? { summaryTitle: data.summaryTitle } : {}),
        ...(data.summaryTemplate !== undefined
          ? { summaryTemplate: data.summaryTemplate as 'DEFAULT' | 'SOAP' | 'BIRP' | 'GIRP' | 'PIEC' }
          : {}),
      },
    });

    return result;
  }

  async generateComprehensiveSummaryForClient(clientId: string, start?: string, end?: string) {
    try {
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
        select: { trackingEnabled: true },
      });

      if (!client || !client.trackingEnabled) {
        return {
          title: 'Comprehensive Client Summary',
          summary: 'Client has disabled progress tracking.',
          keyInsights: ['Progress tracking is disabled'],
          recommendations: ['Client has chosen to disable progress tracking'],
        };
      }

      const sessionWhere: Record<string, unknown> = { clientId };
      if (start && end) {
        sessionWhere.recordedAt = {
          gte: new Date(start),
          lte: new Date(end),
        };
      }
      const sessions = await this.prisma.session.findMany({
        where: sessionWhere,
        select: {
          id: true,
          title: true,
          aiSummary: true,
          recordedAt: true,
        },
        orderBy: { recordedAt: 'asc' },
      });

      this.logger.log(`Found ${sessions.length} total sessions for client ${clientId}`);
      this.logger.log(
        `Sessions with AI summaries: ${sessions.filter((s) => s.aiSummary && s.aiSummary.trim().length > 0).length}`
      );

      const sessionsWithSummaries = sessions.filter(
        (session) => session.aiSummary && session.aiSummary.trim().length > 0
      );

      if (sessionsWithSummaries.length === 0) {
        this.logger.warn(`No sessions with summaries found for client ${clientId}`);
        return {
          title: 'Comprehensive Client Summary',
          summary: 'No session summaries available for analysis.',
          keyInsights: ['No completed sessions with summaries available'],
          recommendations: ['Complete and process sessions to generate comprehensive summary'],
        };
      }

      this.logger.log(`Processing ${sessionsWithSummaries.length} sessions with summaries`);

      const cachedSummary = await this.prisma.comprehensiveSummary.findFirst({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });

      const currentSessionCount = sessionsWithSummaries.length;

      if (cachedSummary && cachedSummary.sessionCount === currentSessionCount) {
        return {
          title: cachedSummary.title,
          summary: cachedSummary.summary,
          keyInsights: cachedSummary.keyInsights,
          recommendations: cachedSummary.recommendations,
          isCached: true,
        };
      }

      const sessionSummaries = sessionsWithSummaries.map((session) => ({
        title: session.title || 'Untitled Session',
        summary: session.aiSummary!,
        recordedAt: session.recordedAt,
        sessionId: session.id,
      }));

      this.logger.log(
        `Session summaries prepared:`,
        sessionSummaries.map((s) => ({
          id: s.sessionId,
          title: s.title,
          summaryLength: s.summary.length,
          summaryPreview: s.summary.substring(0, 100) + '...',
        }))
      );

      let comprehensiveSummary;
      try {
        comprehensiveSummary = await this.aiService.generateComprehensiveSummary(sessionSummaries);
      } catch (aiError) {
        throw new Error(`AI service failed: ${aiError.message}`);
      }

      const latestSessionRecorded = Math.max(...sessionsWithSummaries.map((session) => session.recordedAt.getTime()));

      try {
        await this.prisma.comprehensiveSummary.upsert({
          where: {
            clientId_lastSessionUpdate: {
              clientId,
              lastSessionUpdate: new Date(latestSessionRecorded),
            },
          },
          update: {
            title: comprehensiveSummary.title,
            summary: comprehensiveSummary.summary,
            keyInsights: comprehensiveSummary.keyInsights,
            recommendations: comprehensiveSummary.recommendations,
            lastSessionUpdate: new Date(latestSessionRecorded),
            sessionCount: currentSessionCount,
            updatedAt: new Date(),
          },
          create: {
            clientId,
            title: comprehensiveSummary.title,
            summary: comprehensiveSummary.summary,
            keyInsights: comprehensiveSummary.keyInsights,
            recommendations: comprehensiveSummary.recommendations,
            lastSessionUpdate: new Date(latestSessionRecorded),
            sessionCount: currentSessionCount,
          },
        });
      } catch (dbError) {
        throw new Error(`Failed to save comprehensive summary: ${dbError.message}`);
      }

      return {
        ...comprehensiveSummary,
        isCached: false,
      };
    } catch (error) {
      throw new Error(`Failed to generate comprehensive summary: ${error.message}`);
    }
  }
}
