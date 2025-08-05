import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { actionItemPrompt } from './prompts/action-item.suggestion';
import { comprehensiveSummaryPrompt } from './prompts/comprehensive-summary';
import { filterTranscriptPrompt } from './prompts/filter-transcript';
import { generateMoreTasksPrompt } from './prompts/generate-more-tasks';
import { meetingSummaryPrompt } from './prompts/meeting-summary';
import { soapNotesPrompt } from './prompts/soap-notes';
import { birpNotesPrompt } from './prompts/birp-notes';
import { girpNotesPrompt } from './prompts/girp-notes';
import { piecNotesPrompt } from './prompts/piec-notes';

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
        weeklyRepetitions: z
          .union([z.string(), z.number()])
          .optional()
          .describe('Number of times per week this should be done'),
        isMandatory: z.boolean().optional().describe('Whether this is a mandatory task'),
        duration: z.string().describe('Estimated time to complete the task'),
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
        weeklyRepetitions: z
          .union([z.string(), z.number()])
          .optional()
          .describe('Number of times per week this should be done'),
        isMandatory: z.boolean().optional().describe('Whether this is a mandatory task'),
        duration: z.string().describe('Estimated time to complete the task'),
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

export type SessionSummaryTemplate = 'DEFAULT' | 'SOAP' | 'BIRP' | 'GIRP' | 'PIEC';

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

  private transformWeeklyRepetitions(suggestions: ActionItemSuggestions): ActionItemSuggestions {
    type Task = typeof actionItemSuggestionsSchema.shape.sessionTasks.element;
    const transformTask = (task: z.infer<Task>) => ({
      ...task,
      weeklyRepetitions:
        typeof task.weeklyRepetitions === 'string' ? parseInt(task.weeklyRepetitions, 10) : task.weeklyRepetitions,
    });
    return {
      sessionTasks: suggestions.sessionTasks.map(transformTask),
      complementaryTasks: suggestions.complementaryTasks.map(transformTask),
    };
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
        max_tokens: 4096,
      });
      const content = response.choices[0]?.message?.content || '';
      this.logger.log(`OpenAI response length: ${content.length}, content preview: ${content.substring(0, 200)}...`);
      return content;
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
      const systemMessage =
        'You are a helpful assistant. Return ONLY the cleaned transcript as plain text. Do NOT return JSON, markdown, or any other structured format. The output must be simple, readable text that can be displayed directly to users.';
      const filteredText = await this.callOpenAI(fullPrompt, systemMessage);
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

  async generateStructuredSummary(
    filteredTranscript: string,
    template: SessionSummaryTemplate = 'DEFAULT'
  ): Promise<SessionSummary> {
    if (!filteredTranscript || filteredTranscript.trim().length === 0) {
      return {
        title: 'Session Summary',
        summary: 'No transcript content available to summarize.',
      };
    }
    try {
      const prompt = this.getMeetingSummaryPrompt(template);
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
      const fullPrompt = `${prompt}\n\nAnalyze the following session transcript and suggest action items:\n\n---\n\n${filteredTranscript}`;

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
        parsedSuggestions = actionItemSuggestionsSchema.parse(jsonData);
      } catch (parseError) {
        this.logger.error(`Error parsing action item suggestions:`, parseError);
        this.logger.error(`Raw suggestion text:`, suggestionText.substring(0, 500) + '...');
        parsedSuggestions = { sessionTasks: [], complementaryTasks: [] };
      }

      const transformedSuggestions = this.transformWeeklyRepetitions(parsedSuggestions);
      const processedSuggestions = this.processActionItemSuggestions(transformedSuggestions);
      return processedSuggestions;
    } catch (error) {
      this.logger.error(`Error in suggestActionItems:`, error);
      this.logger.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  async processSession(
    rawTranscript: string,
    template: SessionSummaryTemplate = 'DEFAULT'
  ): Promise<{
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
        this.generateStructuredSummary(filteredTranscript, template),
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

  async processSessionWithAllTemplates(rawTranscript: string): Promise<{
    filteredTranscript: string;
    defaultSummary: SessionSummary;
    soapSummary: SessionSummary;
    birpSummary: SessionSummary;
    girpSummary: SessionSummary;
    piecSummary: SessionSummary;
    actionItemSuggestions: ActionItemSuggestions;
  }> {
    if (!rawTranscript || rawTranscript.trim().length === 0) {
      const emptySummary = {
        title: 'Session Summary',
        summary: 'No transcript content available to process.',
      };
      return {
        filteredTranscript: '',
        defaultSummary: emptySummary,
        soapSummary: emptySummary,
        birpSummary: emptySummary,
        girpSummary: emptySummary,
        piecSummary: emptySummary,
        actionItemSuggestions: { sessionTasks: [], complementaryTasks: [] },
      };
    }
    try {
      const filteredTranscript = await this.filterTranscript(rawTranscript);

      const [defaultSummary, soapSummary, birpSummary, girpSummary, piecSummary, actionItemSuggestions] =
        await Promise.all([
          this.generateStructuredSummary(filteredTranscript, 'DEFAULT'),
          this.generateStructuredSummary(filteredTranscript, 'SOAP'),
          this.generateStructuredSummary(filteredTranscript, 'BIRP'),
          this.generateStructuredSummary(filteredTranscript, 'GIRP'),
          this.generateStructuredSummary(filteredTranscript, 'PIEC'),
          this.suggestActionItems(filteredTranscript),
        ]);

      return {
        filteredTranscript,
        defaultSummary,
        soapSummary,
        birpSummary,
        girpSummary,
        piecSummary,
        actionItemSuggestions,
      };
    } catch (error) {
      this.logger.error(`Error in processSessionWithAllTemplates:`, error);
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

  private getMeetingSummaryPrompt(template: SessionSummaryTemplate = 'DEFAULT'): string {
    switch (template) {
      case 'SOAP':
        return soapNotesPrompt;
      case 'BIRP':
        return birpNotesPrompt;
      case 'GIRP':
        return girpNotesPrompt;
      case 'PIEC':
        return piecNotesPrompt;
      case 'DEFAULT':
      default:
        return meetingSummaryPrompt;
    }
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
    this.logger.log(`Processing ${sortedSessions.length} sessions for comprehensive summary`);

    const sessionData = sortedSessions
      .map(
        (session, index) =>
          `Session ${index + 1} (${new Date(session.recordedAt).toLocaleDateString()}):\nTitle: ${session.title}\nSummary: ${session.summary}\n`
      )
      .join('\n---\n\n');

    this.logger.log(`Session data length: ${sessionData.length}`);
    this.logger.log(`First session preview: ${sessionData.substring(0, 500)}...`);
    const prompt = this.getComprehensiveSummaryPrompt();
    const fullPrompt = `${prompt}\n\nAnalyze the following session summaries to create a comprehensive client summary:\n\n---\n\n${sessionData}`;
    this.logger.log(`Comprehensive summary prompt length: ${fullPrompt.length}`);
    const summaryText = await this.callOpenAI(fullPrompt);
    this.logger.log(`Comprehensive summary response length: ${summaryText?.length || 0}`);
    if (!summaryText || summaryText.trim().length === 0) {
      this.logger.error('Empty response from OpenAI for comprehensive summary');
      return {
        title: 'Comprehensive Client Summary',
        summary: 'AI comprehensive summary generation failed - no response received from the AI service.',
        keyInsights: ['AI analysis failed - no response received'],
        recommendations: ['Check AI service configuration and try again'],
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

      // Handle nested summary structure
      if (jsonData.summary && typeof jsonData.summary === 'object') {
        // Convert nested object to markdown string
        const summaryObject = jsonData.summary;
        let markdownSummary = '';

        for (const [key, value] of Object.entries(summaryObject)) {
          if (typeof value === 'object' && value !== null) {
            markdownSummary += `## ${key}\n\n`;
            for (const [subKey, subValue] of Object.entries(value)) {
              if (typeof subValue === 'string') {
                markdownSummary += `### ${subKey}\n${subValue}\n\n`;
              }
            }
          } else if (typeof value === 'string') {
            markdownSummary += `## ${key}\n\n${value}\n\n`;
          }
        }
        // Create properly structured summary
        const flattenedData = {
          ...jsonData,
          summary: markdownSummary.trim(),
        };
        parsedSummary = comprehensiveSummarySchema.parse(flattenedData);
      } else {
        // Normal flat structure
        parsedSummary = comprehensiveSummarySchema.parse(jsonData);
      }
    } catch (error) {
      this.logger.error('Error parsing comprehensive summary:', error);
      this.logger.error('Raw summary text:', summaryText.substring(0, 500) + '...');
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
    return parsedSummary;
  }
}
