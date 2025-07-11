import { Controller, Get, Post, Put, Body, Param, Patch, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { ActionItemSource } from '@repo/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CreatePlanDto {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  actionItems: {
    description: string;
    category?: string;
    target?: string;
    frequency?: string;
    weeklyRepetitions?: number;
    isMandatory?: boolean;
    whyImportant?: string;
    recommendedActions?: string;
    toolsToHelp?: string;
    source?: (typeof ActionItemSource)[keyof typeof ActionItemSource];
    resources?: {
      type: 'LINK' | 'PDF';
      url: string;
      title?: string;
    }[];
  }[];
}

@Controller('plans')
@ApiTags('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanController {
  constructor(private planService: PlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully.' })
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return await this.planService.createPlan(createPlanDto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a plan' })
  @ApiResponse({ status: 200, description: 'Plan published successfully.' })
  async publishPlan(@Param('id') planId: string) {
    return await this.planService.publishPlan(planId);
  }

  @Get('practitioner/:id')
  @ApiOperation({ summary: 'Get plans by practitioner' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully.' })
  async getPlansByPractitioner(@Param('id') practitionerId: string) {
    return await this.planService.getPlansByPractitioner(practitionerId);
  }

  @Get('client/:id')
  @ApiOperation({ summary: 'Get plans by client' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully.' })
  async getPlansByClient(@Param('id') clientId: string) {
    return await this.planService.getPlansByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully.' })
  async getPlanById(@Param('id') planId: string) {
    return await this.planService.getPlanById(planId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully.' })
  async updatePlan(@Param('id') planId: string, @Body() updateData: Partial<CreatePlanDto>) {
    return await this.planService.updatePlan(planId, updateData);
  }

  // Suggested Action Items endpoints
  @Get(':id/with-suggestions')
  @ApiOperation({ summary: 'Get plan with AI suggestions' })
  @ApiResponse({ status: 200, description: 'Plan with suggestions retrieved successfully.' })
  async getPlanWithSuggestions(@Param('id') planId: string) {
    return await this.planService.getPlanWithSuggestions(planId);
  }

  @Get(':id/suggestions')
  @ApiOperation({ summary: 'Get suggested action items for a plan' })
  @ApiResponse({ status: 200, description: 'Suggested action items retrieved successfully.' })
  async getSuggestedActionItems(@Param('id') planId: string) {
    return await this.planService.getSuggestedActionItems(planId);
  }

  @Post('suggestions/:suggestionId/approve')
  @ApiOperation({ summary: 'Approve a suggested action item' })
  @ApiResponse({ status: 200, description: 'Suggested action item approved successfully.' })
  async approveSuggestedActionItem(@Param('suggestionId') suggestionId: string) {
    return await this.planService.approveSuggestedActionItem(suggestionId);
  }

  @Post('suggestions/:suggestionId/reject')
  @ApiOperation({ summary: 'Reject a suggested action item' })
  @ApiResponse({ status: 200, description: 'Suggested action item rejected successfully.' })
  async rejectSuggestedActionItem(@Param('suggestionId') suggestionId: string) {
    return await this.planService.rejectSuggestedActionItem(suggestionId);
  }

  @Patch('suggestions/:suggestionId')
  @ApiOperation({ summary: 'Edit a suggested action item' })
  @ApiResponse({ status: 200, description: 'Suggested action item updated successfully.' })
  async updateSuggestedActionItem(
    @Param('suggestionId') suggestionId: string,
    @Body()
    updateData: {
      description?: string;
      category?: string;
      target?: string;
      frequency?: string;
    }
  ) {
    return await this.planService.updateSuggestedActionItem(suggestionId, updateData);
  }

  @Post(':id/action-items')
  @ApiOperation({ summary: 'Add a custom action item to a plan' })
  @ApiResponse({ status: 201, description: 'Custom action item added successfully.' })
  async addCustomActionItem(
    @Param('id') planId: string,
    @Body()
    actionItemData: {
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
      resources?: {
        type: 'LINK' | 'PDF';
        url: string;
        title?: string;
      }[];
    }
  ) {
    return await this.planService.addCustomActionItem(planId, actionItemData);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate action plan from session' })
  @ApiResponse({ status: 200, description: 'Plan generated successfully.' })
  async generatePlanFromSession(@Body() body: { sessionId: string }) {
    return await this.planService.generatePlanFromSession(body.sessionId);
  }

  @Post(':planId/generate-more-tasks')
  @ApiOperation({ summary: 'Generate additional complementary tasks for a plan' })
  @ApiResponse({ status: 200, description: 'Additional tasks generated successfully.' })
  async generateMoreComplementaryTasks(@Param('planId') planId: string) {
    return await this.planService.generateMoreComplementaryTasks(planId);
  }

  @Patch(':planId/action-items/:actionItemId')
  @ApiOperation({ summary: 'Update an action item in a plan' })
  @ApiResponse({ status: 200, description: 'Action item updated successfully.' })
  async updateActionItem(
    @Param('planId') planId: string,
    @Param('actionItemId') actionItemId: string,
    @Body()
    updateData: {
      description?: string;
      category?: string;
      target?: string;
      frequency?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
      resources?: {
        type: 'LINK' | 'PDF' | 'IMAGE' | 'DOCX';
        url: string;
        title?: string;
      }[];
      daysOfWeek?: string[];
    }
  ) {
    return await this.planService.updateActionItem(planId, actionItemId, updateData);
  }

  @Delete(':planId/action-items/:actionItemId')
  @ApiOperation({ summary: 'Delete an action item from a plan' })
  @ApiResponse({ status: 200, description: 'Action item deleted successfully.' })
  async deleteActionItem(@Param('planId') planId: string, @Param('actionItemId') actionItemId: string) {
    return await this.planService.deleteActionItem(planId, actionItemId);
  }
}
