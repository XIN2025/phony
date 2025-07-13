import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import { filterTranscriptPrompt } from './prompts/filter-transcript';
import { meetingSummaryPrompt } from './prompts/meeting-summary';
import { actionItemPrompt } from './prompts/action-item.suggestion';
import { generateMoreTasksPrompt } from './prompts/generate-more-tasks';
import { comprehensiveSummaryPrompt } from './prompts/comprehensive-summary';

const summarySchema = z.object({
  title: z.string().describe('A concise, relevant title for the session, max 5 words'),
  summary: z.string().describe('A detailed, structured markdown summary of the session'),
});

const comprehensiveSummarySchema = z.object({
  title: z.string().describe('Title for the comprehensive summary'),
  summary: z.string().describe('A detailed, structured markdown comprehensive summary'),
  keyInsights: z.array(z.string()).describe('Array of key insights about the client journey'),
  recommendations: z.array(z.string()).describe('Array of recommendations for future sessions'),
});

const actionItemSuggestionsSchema = z.object({
  sessionTasks: z
    .array(
      z.object({
        description: z.string().describe('A clear, actionable task description'),
        category: z.string().optional().describe('Optional category for the task'),
        target: z.string().optional().describe('Optional target or goal for the task'),
        frequency: z.string().optional().describe('Optional frequency or schedule for the task'),
        weeklyRepetitions: z.number().optional().describe('Number of times per week this should be done'),
        isMandatory: z.boolean().optional().describe('Whether this is a mandatory task'),
        whyImportant: z.string().optional().describe('Why this task is important for the client'),
        recommendedActions: z.string().optional().describe('Specific steps to complete this task'),
        toolsToHelp: z
          .union([
            z.string().optional(),
            z
              .array(
                z.object({
                  name: z.string(),
                  whatItEnables: z.string(),
                  link: z.string().optional(),
                })
              )
              .optional(),
          ])
          .describe('Tools, apps, or resources to help with this task'),
      })
    )
    .describe('Array of action items discussed in the session'),
  complementaryTasks: z
    .array(
      z.object({
        description: z.string().describe('A clear, actionable task description'),
        category: z.string().optional().describe('Optional category for the task'),
        target: z.string().optional().describe('Optional target or goal for the task'),
        frequency: z.string().optional().describe('Optional schedule or frequency for the task'),
        weeklyRepetitions: z.number().optional().describe('Number of times per week this should be done'),
        isMandatory: z.boolean().optional().describe('Whether this is a mandatory task'),
        whyImportant: z.string().optional().describe('Why this task is important for the client'),
        recommendedActions: z.string().optional().describe('Specific steps to complete this task'),
        toolsToHelp: z
          .union([
            z.string().optional(),
            z
              .array(
                z.object({
                  name: z.string(),
                  whatItEnables: z.string(),
                  link: z.string().optional(),
                })
              )
              .optional(),
          ])
          .describe('Tools, apps, or resources to help with this task'),
      })
    )
    .describe('Array of complementary action items suggested by AI'),
});

export type SessionSummary = z.infer<typeof summarySchema>;
export type ComprehensiveSummary = z.infer<typeof comprehensiveSummarySchema>;
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

  private convertToolsToHelpToString(toolsToHelp: unknown): string | undefined {
    if (!toolsToHelp) return undefined;

    // If it's already a string, return as is
    if (typeof toolsToHelp === 'string') return toolsToHelp;

    // If it's an array, convert to formatted string
    if (Array.isArray(toolsToHelp)) {
      return toolsToHelp
        .map((tool) => {
          if (tool.link) {
            return `${tool.name} (${tool.whatItEnables}) - ${tool.link}`;
          } else {
            return `${tool.name} (${tool.whatItEnables})`;
          }
        })
        .join('\n');
    }

    return undefined;
  }

  private processActionItemSuggestions(suggestions: ActionItemSuggestions): ActionItemSuggestions {
    const processed = {
      sessionTasks:
        suggestions.sessionTasks?.map((task) => ({
          ...task,
          toolsToHelp: this.convertToolsToHelpToString(task.toolsToHelp),
        })) || [],
      complementaryTasks:
        suggestions.complementaryTasks?.map((task) => ({
          ...task,
          toolsToHelp: this.convertToolsToHelpToString(task.toolsToHelp),
        })) || [],
    };

    return processed;
  }

  async filterTranscript(rawTranscript: string): Promise<string> {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
      return '';
    }

    if (rawTranscript.length > 100000) {
      rawTranscript = rawTranscript.substring(0, 100000);
    }

    const prompt = this.getFilteredTranscriptPrompt();
    const fullPrompt = `${prompt}\n\nPlease filter the following transcript:\n\n---\n\n${rawTranscript}`;

    const result = await this.model.generateContent(fullPrompt);

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const filteredText = result.response.text();

    if (!filteredText) {
      return rawTranscript;
    }

    return filteredText;
  }

  async generateStructuredSummary(filteredTranscript: string): Promise<SessionSummary> {
    if (!filteredTranscript || filteredTranscript.trim().length === 0) {
      return {
        title: 'Session Summary',
        summary: 'No transcript content available to summarize.',
      };
    }

    const prompt = this.getMeetingSummaryPrompt();
    const fullPrompt = `${prompt}\n\nGenerate a summary for the following transcript:\n\n---\n\n${filteredTranscript}`;

    const result = await this.model.generateContent(fullPrompt);

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const summaryText = result.response.text();

    if (!summaryText) {
      return {
        title: 'Session Summary',
        summary: 'AI summary generation failed - no response received.',
      };
    }

    let parsedSummary: SessionSummary;
    try {
      const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const jsonString = jsonMatch[0];
      const jsonData = JSON.parse(jsonString);
      parsedSummary = summarySchema.parse(jsonData);
    } catch {
      parsedSummary = {
        title: 'Session Summary',
        summary: summaryText,
      };
    }

    return parsedSummary;
  }

  async suggestActionItems(filteredTranscript: string): Promise<ActionItemSuggestions> {
    if (!filteredTranscript || filteredTranscript.trim().length === 0) {
      return { sessionTasks: [], complementaryTasks: [] };
    }

    const prompt = this.getActionItemSuggestionPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session transcript and suggest action items:\n\n---\n\n${filteredTranscript}`;

    const result = await this.model.generateContent(fullPrompt);

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const suggestionText = result.response.text();

    if (!suggestionText) {
      return { sessionTasks: [], complementaryTasks: [] };
    }

    let parsedSuggestions: ActionItemSuggestions;
    try {
      const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedSuggestions = actionItemSuggestionsSchema.parse(JSON.parse(jsonMatch[0]));
    } catch {
      parsedSuggestions = { sessionTasks: [], complementaryTasks: [] };
    }

    return this.processActionItemSuggestions(parsedSuggestions);
  }

  async processSession(rawTranscript: string): Promise<{
    filteredTranscript: string;
    summary: SessionSummary;
    actionItemSuggestions: ActionItemSuggestions;
  }> {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
      return {
        filteredTranscript: '',
        summary: {
          title: 'Session Summary',
          summary: 'No transcript content available to process.',
        },
        actionItemSuggestions: { sessionTasks: [], complementaryTasks: [] },
      };
    }

    const filteredTranscript = await this.filterTranscript(rawTranscript);

    const [summary, actionItemSuggestions] = await Promise.all([
      this.generateStructuredSummary(filteredTranscript),
      this.suggestActionItems(filteredTranscript),
    ]);

    return {
      filteredTranscript,
      summary,
      actionItemSuggestions,
    };
  }

  async generateAdditionalComplementaryTasks(
    sessionData: string,
    existingSessionTasks: string[],
    existingComplementaryTasks: string[]
  ): Promise<ActionItemSuggestions> {
    if (!sessionData || sessionData.trim().length === 0) {
      console.log('No session data provided for additional task generation');
      return { sessionTasks: [], complementaryTasks: [] };
    }

    const existingTasksContext = [
      ...existingSessionTasks.map((task) => `Session Task: ${task}`),
      ...existingComplementaryTasks.map((task) => `Complementary Task: ${task}`),
    ].join('\n');

    console.log(
      `Generating additional tasks with ${existingSessionTasks.length} session tasks and ${existingComplementaryTasks.length} complementary tasks`
    );

    const prompt = this.getGenerateMoreTasksPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session data and existing tasks to generate additional complementary tasks:\n\n---\n\nSession Data:\n${sessionData}\n\n---\n\nExisting Tasks:\n${existingTasksContext || 'No existing tasks'}\n\n---`;

    const result = await this.model.generateContent(fullPrompt);

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const suggestionText = result.response.text();
    console.log('AI response text:', suggestionText.substring(0, 500) + '...');

    if (!suggestionText) {
      console.log('No suggestion text received from AI');
      return { sessionTasks: [], complementaryTasks: [] };
    }

    let parsedSuggestions: ActionItemSuggestions;
    try {
      const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonData = JSON.parse(jsonMatch[0]);
      console.log('Parsed JSON data:', JSON.stringify(jsonData, null, 2));

      // Handle the case where only complementaryTasks is returned (as expected by the prompt)
      if (jsonData.complementaryTasks && !jsonData.sessionTasks) {
        parsedSuggestions = {
          sessionTasks: [], // Always empty for "generate more" requests
          complementaryTasks: jsonData.complementaryTasks,
        };
        console.log(
          `Successfully parsed ${parsedSuggestions.complementaryTasks?.length || 0} complementary tasks (sessionTasks was empty as expected)`
        );
      } else {
        // Try to parse with the full schema (for backward compatibility)
        parsedSuggestions = actionItemSuggestionsSchema.parse(jsonData);
        console.log(
          `Successfully parsed ${parsedSuggestions.complementaryTasks?.length || 0} complementary tasks using full schema`
        );
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      parsedSuggestions = { sessionTasks: [], complementaryTasks: [] };
    }

    return this.processActionItemSuggestions(parsedSuggestions);
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

  private getGenerateMoreTasksPrompt(): string {
    return generateMoreTasksPrompt;
  }

  private getComprehensiveSummaryPrompt(): string {
    return comprehensiveSummaryPrompt;
  }

  async generateComprehensiveSummary(
    sessionSummaries: Array<{
      title: string;
      summary: string;
      recordedAt: Date;
      sessionId: string;
    }>
  ): Promise<ComprehensiveSummary> {
    if (!sessionSummaries || sessionSummaries.length === 0) {
      return {
        title: 'Comprehensive Client Summary',
        summary: 'No session summaries available to analyze.',
        keyInsights: ['No sessions available for analysis'],
        recommendations: ['Begin regular sessions to establish therapeutic relationship'],
      };
    }

    // Sort sessions chronologically (oldest first)
    const sortedSessions = sessionSummaries.sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    // Prepare session data for AI analysis
    const sessionData = sortedSessions
      .map(
        (session, index) =>
          `Session ${index + 1} (${new Date(session.recordedAt).toLocaleDateString()}):\nTitle: ${session.title}\nSummary: ${session.summary}\n`
      )
      .join('\n---\n\n');

    const prompt = this.getComprehensiveSummaryPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session summaries to create a comprehensive client summary:\n\n---\n\n${sessionData}`;

    const result = await this.model.generateContent(fullPrompt);

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const summaryText = result.response.text();

    if (!summaryText) {
      return {
        title: 'Comprehensive Client Summary',
        summary: 'AI comprehensive summary generation failed - no response received.',
        keyInsights: ['AI analysis failed'],
        recommendations: ['Review sessions manually'],
      };
    }

    let parsedSummary: ComprehensiveSummary;
    try {
      const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const jsonString = jsonMatch[0];
      const jsonData = JSON.parse(jsonString);
      parsedSummary = comprehensiveSummarySchema.parse(jsonData);
    } catch (error) {
      this.logger.error('Error parsing comprehensive summary:', error);
      parsedSummary = {
        title: 'Comprehensive Client Summary',
        summary: summaryText,
        keyInsights: ['Analysis completed but parsing failed'],
        recommendations: ['Review generated summary manually'],
      };
    }

    return parsedSummary;
  }
}
