import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import { filterTranscriptPrompt } from './prompts/filter-transcript';
import { meetingSummaryPrompt } from './prompts/meeting-summary';
import { actionItemPrompt } from './prompts/action-item.suggestion';

// Schema for structured summarization output
const summarySchema = z.object({
  title: z.string().describe('A concise, relevant title for the session, max 5 words'),
  summary: z.string().describe('A detailed, structured markdown summary of the session'),
});

// Schema for action item suggestions
const actionItemSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        description: z.string().describe('A clear, actionable task description'),
        category: z.string().optional().describe('Optional category for the task'),
        target: z.string().optional().describe('Optional target or goal for the task'),
        frequency: z.string().optional().describe('Optional frequency or schedule for the task'),
      })
    )
    .describe('Array of suggested action items from the session'),
});

export type SessionSummary = z.infer<typeof summarySchema>;
export type ActionItemSuggestions = z.infer<typeof actionItemSuggestionsSchema>;

@Injectable()
export class AiService {
  private readonly model: GenerativeModel;
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async filterTranscript(rawTranscript: string): Promise<string> {
    try {
      this.logger.log('Starting transcript filtering process...');

      const prompt = this.getFilteredTranscriptPrompt();
      const fullPrompt = `${prompt}\n\nPlease filter the following transcript:\n\n---\n\n${rawTranscript}`;

      const result = await this.model.generateContent(fullPrompt);
      const filteredText = result.response.text();

      this.logger.log('Transcript filtering completed successfully');
      return filteredText;
    } catch (error) {
      this.logger.error('Error filtering transcript:', error);
      throw new Error('Failed to filter transcript');
    }
  }

  async generateStructuredSummary(filteredTranscript: string): Promise<SessionSummary> {
    try {
      this.logger.log('Starting structured summarization process...');

      const prompt = this.getMeetingSummaryPrompt();
      const fullPrompt = `${prompt}\n\nGenerate a summary for the following transcript:\n\n---\n\n${filteredTranscript}`;

      const result = await this.model.generateContent(fullPrompt);
      const summaryText = result.response.text();

      this.logger.log('Raw AI summary response:', summaryText);

      let parsedSummary: SessionSummary;
      try {
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        const jsonString = jsonMatch[0];
        this.logger.log('Extracted JSON string:', jsonString);

        const jsonData = JSON.parse(jsonString);
        this.logger.log('Parsed JSON data:', jsonData);

        parsedSummary = summarySchema.parse(jsonData);
        this.logger.log('Validated summary:', parsedSummary);
      } catch (error) {
        this.logger.warn('Failed to parse structured summary, using fallback format. Error:', error);
        parsedSummary = {
          title: 'Session Summary',
          summary: summaryText,
        };
      }

      this.logger.log('Structured summarization completed successfully');
      return parsedSummary;
    } catch (error) {
      this.logger.error('Error generating structured summary:', error);
      throw new Error('Failed to generate structured summary');
    }
  }

  async suggestActionItems(filteredTranscript: string): Promise<ActionItemSuggestions> {
    try {
      this.logger.log('Starting action item suggestion process...');

      const prompt = this.getActionItemSuggestionPrompt();
      const fullPrompt = `${prompt}\n\nAnalyze the following session transcript and suggest action items:\n\n---\n\n${filteredTranscript}`;

      const result = await this.model.generateContent(fullPrompt);
      const suggestionText = result.response.text();

      let parsedSuggestions: ActionItemSuggestions;
      try {
        const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        parsedSuggestions = actionItemSuggestionsSchema.parse(JSON.parse(jsonMatch[0]));
      } catch (parseError) {
        this.logger.warn('Failed to parse action item suggestions, using empty array');
        parsedSuggestions = { suggestions: [] };
      }

      this.logger.log(
        `Action item suggestion completed successfully. Found ${parsedSuggestions.suggestions.length} suggestions`
      );
      return parsedSuggestions;
    } catch (error) {
      this.logger.error('Error suggesting action items:', error);
      throw new Error('Failed to suggest action items');
    }
  }

  async processSession(rawTranscript: string): Promise<{
    filteredTranscript: string;
    summary: SessionSummary;
    actionItemSuggestions: ActionItemSuggestions;
  }> {
    try {
      this.logger.log('Starting complete AI processing pipeline...');

      const filteredTranscript = await this.filterTranscript(rawTranscript);

      const [summary, actionItemSuggestions] = await Promise.all([
        this.generateStructuredSummary(filteredTranscript),
        this.suggestActionItems(filteredTranscript),
      ]);

      this.logger.log('Complete AI processing pipeline completed successfully');
      return {
        filteredTranscript,
        summary,
        actionItemSuggestions,
      };
    } catch (error) {
      this.logger.error('Error in complete AI processing pipeline:', error);
      throw error;
    }
  }

  private getFilteredTranscriptPrompt(): string {
    return filterTranscriptPrompt;
  }

  private getMeetingSummaryPrompt(): string {
    return meetingSummaryPrompt;
  }

  private getActionItemSuggestionPrompt(): string {
    return actionItemPrompt;
  }
}
