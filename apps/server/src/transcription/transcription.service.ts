import { Injectable, Logger } from '@nestjs/common';
import { createClient, DeepgramClient } from '@deepgram/sdk';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TranscriptionService {
  private readonly deepgram: DeepgramClient;
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.deepgramApiKey');
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is not defined in the environment variables.');
    }
    this.deepgram = createClient(apiKey);
  }

  async transcribeAudio(filePath: string): Promise<string | null> {
    if (!fs.existsSync(filePath)) {
      this.logger.error(`Transcription failed: File does not exist at path: ${filePath}`);
      return null;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      if (fileBuffer.byteLength === 0) {
        this.logger.error(`Transcription failed: File is empty at path: ${filePath}`);
        return null;
      }

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(fileBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        this.logger.error('Deepgram API returned an error:', JSON.stringify(error, null, 2));
        return null;
      }

      return result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';
    } catch (err) {
      this.logger.error(`An unexpected error occurred during transcription for ${filePath}:`, err);
      return null;
    }
  }

  async transcribeAudioBuffer(
    audioBuffer: Buffer,
    sessionId: string
  ): Promise<{ transcript: string | null; savedFilePath?: string }> {
    try {
      if (!audioBuffer) {
        this.logger.error(`Transcription failed: Audio buffer is undefined for session: ${sessionId}`);
        return { transcript: null };
      }

      if (audioBuffer.byteLength === 0) {
        this.logger.error(`Transcription failed: Audio buffer is empty for session: ${sessionId}`);
        return { transcript: null };
      }

      this.logger.log(
        `Starting Deepgram transcription for session ${sessionId}. Buffer size: ${audioBuffer.byteLength} bytes`
      );

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        this.logger.error(`Deepgram API returned an error for session ${sessionId}:`, JSON.stringify(error, null, 2));
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        return { transcript: null, savedFilePath };
      }

      this.logger.log(`Deepgram response received for session ${sessionId}:`, {
        hasResults: !!result.results,
        channelsCount: result.results?.channels?.length || 0,
        alternativesCount: result.results?.channels?.[0]?.alternatives?.length || 0,
        hasParagraphs: !!result.results?.channels?.[0]?.alternatives?.[0]?.paragraphs,
        rawTranscript: result.results?.channels?.[0]?.alternatives?.[0]?.transcript || 'NO_TRANSCRIPT',
      });

      const transcript = result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';

      if (!transcript || transcript.trim().length === 0) {
        this.logger.error(
          `Transcription returned empty result for session ${sessionId}. Raw response:`,
          JSON.stringify(result, null, 2)
        );
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        return { transcript: null, savedFilePath };
      }

      this.logger.log(
        `Transcription successful for session ${sessionId}. Transcript length: ${transcript.length} characters`
      );
      return { transcript };
    } catch (err) {
      this.logger.error(`An unexpected error occurred during transcription for session ${sessionId}:`, err);
      const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
      return { transcript: null, savedFilePath };
    }
  }

  private saveAudioForDebugging(audioBuffer: Buffer, sessionId: string): string {
    try {
      if (!audioBuffer) {
        throw new Error(`Cannot save undefined audio buffer for session: ${sessionId}`);
      }

      const uploadsDir = path.join(process.cwd(), 'uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `debug_${sessionId}_${Date.now()}.webm`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, audioBuffer);

      this.logger.log(`Audio saved for debugging due to transcription failure: ${filePath}`);
      return `/uploads/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to save audio for debugging: ${error}`);
      throw error;
    }
  }
}
