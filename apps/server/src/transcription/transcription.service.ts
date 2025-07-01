import { Injectable, Logger } from '@nestjs/common';
import { createClient, DeepgramClient } from '@deepgram/sdk';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class TranscriptionService {
  private readonly deepgram: DeepgramClient;
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
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
        this.logger.error('Deepgram API returned an error:', error.message);
        return null;
      }

      return result.results.channels[0].alternatives[0].paragraphs?.transcript ?? '';
    } catch (err) {
      this.logger.error(`An unexpected error occurred during transcription for ${filePath}:`, err.stack);
      return null;
    }
  }
}
