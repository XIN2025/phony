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
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('DEEPGRAM_API_KEY is not defined or empty in the environment variables.');
    }
    this.deepgram = createClient(apiKey);

    // Test the API key on startup
    this.testDeepgramConnection().catch((error) => {
      this.logger.error('Failed to test Deepgram connection on startup:', error);
    });
  }

  private async testDeepgramConnection(): Promise<void> {
    try {
      this.logger.log('Testing Deepgram API connection...');

      // Create a minimal test audio buffer (silence)
      const testBuffer = Buffer.alloc(1024); // 1KB of silence

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(testBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        this.logger.error('Deepgram API test failed:', error);
        throw new Error(`Deepgram API test failed: ${error.message || 'Unknown error'}`);
      }

      this.logger.log('Deepgram API connection test successful');
    } catch (error) {
      this.logger.error('Deepgram API connection test failed:', error);
      throw error;
    }
  }

  async transcribeAudio(filePath: string): Promise<string | null> {
    if (!fs.existsSync(filePath)) {
      this.logger.error(`File does not exist: ${filePath}`);
      return null;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      if (fileBuffer.byteLength === 0) {
        this.logger.error(`File is empty: ${filePath}`);
        return null;
      }

      this.logger.log(`Attempting to transcribe file: ${filePath} (${fileBuffer.byteLength} bytes)`);

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(fileBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        this.logger.error(`Deepgram API error:`, error);
        return null;
      }

      if (!result || !result.results || !result.results.channels || result.results.channels.length === 0) {
        this.logger.error(`Deepgram returned empty or invalid result structure`);
        return null;
      }

      const transcript = result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';

      if (!transcript || transcript.trim().length === 0) {
        this.logger.error(`Deepgram returned empty transcript for file: ${filePath}`);
        return null;
      }

      this.logger.log(`Successfully transcribed file: ${filePath} (${transcript.length} characters)`);
      return transcript;
    } catch (error) {
      this.logger.error(`Error transcribing file ${filePath}:`, error);
      this.logger.error(`Error stack:`, error.stack);
      return null;
    }
  }

  async transcribeAudioBuffer(
    audioBuffer: Buffer,
    sessionId: string
  ): Promise<{ transcript: string | null; savedFilePath?: string }> {
    try {
      if (!audioBuffer) {
        this.logger.error(`No audio buffer provided for session: ${sessionId}`);
        return { transcript: null };
      }

      if (audioBuffer.byteLength === 0) {
        this.logger.error(`Audio buffer is empty for session: ${sessionId}`);
        return { transcript: null };
      }

      this.logger.log(
        `Attempting to transcribe audio buffer for session: ${sessionId} (${audioBuffer.byteLength} bytes)`
      );

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        this.logger.error(`Deepgram API error for session ${sessionId}:`, error);
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        this.logger.log(`Saved audio for debugging: ${savedFilePath}`);
        return { transcript: null, savedFilePath };
      }

      if (!result || !result.results || !result.results.channels || result.results.channels.length === 0) {
        this.logger.error(`Deepgram returned empty or invalid result structure for session: ${sessionId}`);
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        this.logger.log(`Saved audio for debugging: ${savedFilePath}`);
        return { transcript: null, savedFilePath };
      }

      const transcript = result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';

      if (!transcript || transcript.trim().length === 0) {
        this.logger.error(`Deepgram returned empty transcript for session: ${sessionId}`);
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        this.logger.log(`Saved audio for debugging: ${savedFilePath}`);
        return { transcript: null, savedFilePath };
      }

      this.logger.log(`Successfully transcribed audio for session: ${sessionId} (${transcript.length} characters)`);
      return { transcript };
    } catch (error) {
      this.logger.error(`Error transcribing audio buffer for session ${sessionId}:`, error);
      this.logger.error(`Error stack:`, error.stack);
      const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
      this.logger.log(`Saved audio for debugging: ${savedFilePath}`);
      return { transcript: null, savedFilePath };
    }
  }

  private saveAudioForDebugging(audioBuffer: Buffer, sessionId: string): string {
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

    return `/uploads/${filename}`;
  }
}
