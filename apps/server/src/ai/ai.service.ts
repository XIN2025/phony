import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

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
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Step 3.1: AI Transcript Filtering (The "Noise Canceling" Step)
   * Removes irrelevant information from the raw transcript
   */
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

  /**
   * Step 3.2: AI Structured Summarization (The "Intelligence" Step)
   * Transforms filtered transcript into structured summary
   */
  async generateStructuredSummary(filteredTranscript: string): Promise<SessionSummary> {
    try {
      this.logger.log('Starting structured summarization process...');

      const prompt = this.getMeetingSummaryPrompt();
      const fullPrompt = `${prompt}\n\nGenerate a summary for the following transcript:\n\n---\n\n${filteredTranscript}`;

      const result = await this.model.generateContent(fullPrompt);
      const summaryText = result.response.text();

      // Parse the JSON response
      let parsedSummary: SessionSummary;
      try {
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        parsedSummary = summarySchema.parse(JSON.parse(jsonMatch[0]));
      } catch (parseError) {
        this.logger.warn('Failed to parse structured summary, using fallback format');
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

  /**
   * AI Action Item Suggestion
   * Analyzes the filtered transcript to suggest actionable tasks
   */
  async suggestActionItems(filteredTranscript: string): Promise<ActionItemSuggestions> {
    try {
      this.logger.log('Starting action item suggestion process...');

      const prompt = this.getActionItemSuggestionPrompt();
      const fullPrompt = `${prompt}\n\nAnalyze the following session transcript and suggest action items:\n\n---\n\n${filteredTranscript}`;

      const result = await this.model.generateContent(fullPrompt);
      const suggestionText = result.response.text();

      // Parse the JSON response
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

  /**
   * Complete AI processing pipeline for a session
   */
  async processSession(rawTranscript: string): Promise<{
    filteredTranscript: string;
    summary: SessionSummary;
    actionItemSuggestions: ActionItemSuggestions;
  }> {
    try {
      this.logger.log('Starting complete AI processing pipeline...');

      // Step 1: Filter transcript
      const filteredTranscript = await this.filterTranscript(rawTranscript);

      // Step 2: Generate structured summary and action items in parallel
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

  /**
   * Load transcript filtering prompt
   */
  private getFilteredTranscriptPrompt(): string {
    try {
      const promptPath = path.join(__dirname, 'prompts', 'filtered-transcript.md');
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      this.logger.warn('Could not load filtered transcript prompt file, using fallback');
      return `Your task is to clean up this therapy/wellness session transcript by removing irrelevant information that doesn't help build meaningful action items or insights.

KEEP THIS INFORMATION:
- Important insights about the client's condition, progress, or challenges
- Goals and targets discussed
- Action items, homework, or tasks assigned by the practitioner
- Specific therapeutic techniques or interventions mentioned
- Client's feedback about previous assignments
- Measurable outcomes or improvements

REMOVE THIS INFORMATION:
- Small talk and casual conversation ("How are you?", "Nice weather today")
- Technical interruptions ("Can you hear me?", "Let me share my screen")
- Repetitive confirmations ("Yeah", "Okay", "Got it", "Mm-hmm")
- Off-topic personal discussions unrelated to therapy
- Scheduling discussions for future appointments
- Payment or administrative topics

Please provide a clean, concise version of the transcript that focuses on the therapeutic content and actionable items.`;
    }
  }

  /**
   * Load meeting summary prompt
   */
  private getMeetingSummaryPrompt(): string {
    try {
      const promptPath = path.join(__dirname, 'prompts', 'meeting-summary.md');
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      this.logger.warn('Could not load meeting summary prompt file, using fallback');
      return `You are a therapy session analysis expert. Create a structured summary of the session in the following JSON format:

{
  "title": "Brief session title (max 5 words)",
  "summary": "Detailed markdown summary with the following sections:\n\n### **Key Discussion Points:**\n[List main topics discussed]\n\n### **Decisions Made:**\n[Any decisions or agreements made]\n\n### **Action Items:**\n[Tasks assigned to client with priority levels]\n\n### **Knowledge Base:**\n[Important insights or context for future sessions]"
}

Only return the JSON object, nothing else.`;
    }
  }

  /**
   * Load action item suggestion prompt
   */
  private getActionItemSuggestionPrompt(): string {
    try {
      const promptPath = path.join(__dirname, 'prompts', 'action-item-suggestion.md');
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      this.logger.warn('Could not load action item suggestion prompt file, using fallback');
      return `You are an expert wellness practitioner assistant. Analyze this therapy/wellness session transcript and identify actionable tasks that the practitioner assigned or suggested to the client.

Focus on identifying:
- Specific exercises or activities to practice
- Behavioral changes to implement
- Self-monitoring tasks
- Homework assignments
- Skills to develop or practice
- Goals to work towards

Return your analysis in the following JSON format:

{
  "suggestions": [
    {
      "description": "Clear, actionable task description",
      "category": "optional category (e.g., 'mindfulness', 'exercise', 'journaling')",
      "target": "optional specific goal or target",
      "frequency": "optional frequency (e.g., 'daily', 'twice weekly')"
    }
  ]
}

Only return the JSON object, nothing else. Be specific and actionable in your descriptions.`;
    }
  }
}
