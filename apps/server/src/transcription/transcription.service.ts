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
  }

  async transcribeAudio(filePath: string): Promise<string | null> {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      if (fileBuffer.byteLength === 0) {
        return null;
      }

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(fileBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        return null;
      }

      return result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';
    } catch {
      return null;
    }
  }

  async transcribeAudioBuffer(
    audioBuffer: Buffer,
    sessionId: string
  ): Promise<{ transcript: string | null; savedFilePath?: string }> {
    try {
      if (!audioBuffer) {
        return { transcript: null };
      }

      if (audioBuffer.byteLength === 0) {
        return { transcript: null };
      }

      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
      });

      if (error) {
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        return { transcript: null, savedFilePath };
      }

      const transcript = result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';

      if (!transcript || transcript.trim().length === 0) {
        const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
        return { transcript: null, savedFilePath };
      }

      return { transcript };
    } catch {
      const savedFilePath = this.saveAudioForDebugging(audioBuffer, sessionId);
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
