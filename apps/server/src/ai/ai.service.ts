import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { filterTranscriptPrompt } from './prompts/filter-transcript';
import { meetingSummaryPrompt } from './prompts/meeting-summary';
import { actionItemPrompt } from './prompts/action-item.suggestion';
import { generateMoreTasksPrompt } from './prompts/generate-more-tasks';
import { comprehensiveSummaryPrompt } from './prompts/comprehensive-summary';
import { jsonrepair } from 'jsonrepair';

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
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiService.name);
  private readonly model = 'gpt-4';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private convertToolsToHelpToString(toolsToHelp: unknown): string | undefined {
    if (!toolsToHelp) return undefined;

    if (typeof toolsToHelp === 'string') return toolsToHelp;

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

  private async callOpenAI(prompt: string, systemMessage?: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              systemMessage ||
              'You are a helpful assistant. Respond ONLY with valid JSON that matches the provided schema exactly. Do not include any extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  async filterTranscript(rawTranscript: string): Promise<string> {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
      return '';
    }
    try {
      if (rawTranscript.length > 100000) {
        rawTranscript = rawTranscript.substring(0, 100000);
      }
      const prompt = this.getFilteredTranscriptPrompt();
      const fullPrompt = `${prompt}\n\nPlease filter the following transcript:\n\n---\n\n${rawTranscript}`;
      const filteredText = await this.callOpenAI(fullPrompt);
      if (!filteredText) {
        return rawTranscript;
      }
      return filteredText;
    } catch (error) {
      this.logger.error(`Error in filterTranscript:`, error);
      this.logger.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  async generateStructuredSummary(filteredTranscript: string): Promise<SessionSummary> {
    if (!filteredTranscript || filteredTranscript.trim().length === 0) {
      return {
        title: 'Session Summary',
        summary: 'No transcript content available to summarize.',
      };
    }
    try {
      const prompt = this.getMeetingSummaryPrompt();
      const fullPrompt = `${prompt}\n\nGenerate a summary for the following transcript:\n\n---\n\n${filteredTranscript}`;
      const summaryText = await this.callOpenAI(fullPrompt);
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
      } catch (parseError) {
        this.logger.error(`Error parsing summary:`, parseError);
        this.logger.error(`Raw summary text:`, summaryText.substring(0, 500) + '...');
        parsedSummary = {
          title: 'Session Summary',
          summary: summaryText,
        };
      }
      return parsedSummary;
    } catch (error) {
      this.logger.error(`Error in generateStructuredSummary:`, error);
      this.logger.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  async suggestActionItems(filteredTranscript: string): Promise<ActionItemSuggestions> {
    if (!filteredTranscript || filteredTranscript.trim().length === 0) {
      return { sessionTasks: [], complementaryTasks: [] };
    }
    try {
      const prompt = this.getActionItemSuggestionPrompt();
      const fullPrompt = `${prompt}\n\nAnalyze the following session transcript and suggest action items. Respond ONLY with a JSON object that matches the schema exactly. Do not include any extra text.`;
      const systemMessage = `You are an AI assistant. Respond ONLY with valid JSON in the following format. Do not include any extra text. Example:
{
  "sessionTasks": [
    {
      "description": "Start friendly conversations",
      "category": "Social",
      "target": "Increase social interaction",
      "frequency": "Daily",
      "weeklyRepetitions": 5,
      "isMandatory": false,
      "whyImportant": "Helps reduce loneliness and build confidence.",
      "recommendedActions": "Greet at least one new person each day.",
      "toolsToHelp": [
        {
          "name": "Meetup",
          "whatItEnables": "Find local events",
          "link": "https://www.meetup.com"
        }
      ]
    }
  ],
  "complementaryTasks": [
    {
      "description": "Practice 4-7-8 breathing",
      "category": "Mindfulness",
      "target": "Reduce anxiety",
      "frequency": "Twice daily",
      "weeklyRepetitions": 7,
      "isMandatory": false,
      "whyImportant": "Promotes relaxation and stress reduction.",
      "recommendedActions": "Practice the breathing technique every morning and night.",
      "toolsToHelp": [
        {
          "name": "Calm App",
          "whatItEnables": "Guided breathing exercises",
          "link": "https://www.calm.com"
        }
      ]
    }
  ]
}`;
      console.log('AI SUGGEST ACTION ITEMS - PROMPT:', fullPrompt);
      console.log('AI SUGGEST ACTION ITEMS - SYSTEM MESSAGE:', systemMessage);
      const suggestionTextRaw = await this.callOpenAI(fullPrompt, systemMessage);
      console.log('AI SUGGEST ACTION ITEMS - RAW RESPONSE:', suggestionTextRaw);
      const suggestionText = suggestionTextRaw;
      if (!suggestionText) {
        return { sessionTasks: [], complementaryTasks: [] };
      }
      let parsedSuggestions: ActionItemSuggestions;
      try {
        // Try direct parse
        const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        const jsonString = jsonMatch[0];
        const jsonData = JSON.parse(jsonString);
        parsedSuggestions = actionItemSuggestionsSchema.parse(jsonData);
      } catch (parseError) {
        this.logger.warn('Initial parse failed, attempting jsonrepair...', parseError);
        try {
          const repaired = jsonrepair(suggestionText);
          const jsonMatch = repaired.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON found in repaired response');
          const jsonString = jsonMatch[0];
          const jsonData = JSON.parse(jsonString);
          parsedSuggestions = actionItemSuggestionsSchema.parse(jsonData);
        } catch (repairError) {
          this.logger.error('Error parsing action item suggestions after repair:', repairError);
          this.logger.error('Raw suggestion text:', suggestionText.substring(0, 500) + '...');
          parsedSuggestions = { sessionTasks: [], complementaryTasks: [] };
        }
      }
      const processedSuggestions = this.processActionItemSuggestions(parsedSuggestions);
      return processedSuggestions;
    } catch (error) {
      this.logger.error(`Error in suggestActionItems:`, error);
      this.logger.error(`Error stack:`, error.stack);
      throw error;
    }
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
    try {
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
    } catch (error) {
      this.logger.error(`Error in processSession:`, error);
      this.logger.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  async generateAdditionalComplementaryTasks(
    sessionData: string,
    existingSessionTasks: string[],
    existingComplementaryTasks: string[]
  ): Promise<ActionItemSuggestions> {
    if (!sessionData || sessionData.trim().length === 0) {
      return { sessionTasks: [], complementaryTasks: [] };
    }
    const existingTasksContext = [
      ...existingSessionTasks.map((task) => `Session Task: ${task}`),
      ...existingComplementaryTasks.map((task) => `Complementary Task: ${task}`),
    ].join('\n');
    const prompt = this.getGenerateMoreTasksPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session data and existing tasks to generate additional complementary tasks:\n\n---\n\nSession Data:\n${sessionData}\n\n---\n\nExisting Tasks:\n${existingTasksContext || 'No existing tasks'}\n\n---`;
    const suggestionText = await this.callOpenAI(fullPrompt);
    if (!suggestionText) {
      return { sessionTasks: [], complementaryTasks: [] };
    }
    let parsedSuggestions: ActionItemSuggestions;
    try {
      const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const jsonData = JSON.parse(jsonMatch[0]);
      if (jsonData.complementaryTasks && !jsonData.sessionTasks) {
        parsedSuggestions = {
          sessionTasks: [],
          complementaryTasks: jsonData.complementaryTasks,
        };
      } else {
        parsedSuggestions = actionItemSuggestionsSchema.parse(jsonData);
      }
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
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
    const sortedSessions = sessionSummaries.sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    const sessionData = sortedSessions
      .map(
        (session, index) =>
          `Session ${index + 1} (${new Date(session.recordedAt).toLocaleDateString()}):\nTitle: ${session.title}\nSummary: ${session.summary}\n`
      )
      .join('\n---\n\n');
    const prompt = this.getComprehensiveSummaryPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session summaries to create a comprehensive client summary:\n\n---\n\n${sessionData}`;
    const summaryText = await this.callOpenAI(fullPrompt);
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
