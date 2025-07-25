import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ActionItemService } from './action-item.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/user.decorator';

interface CreateCompletionDto {
  actionItemId: string;
  clientId: string;
  rating?: number;
  journalEntry?: string;
  achievedValue?: string;
}

@Controller('action-items')
@ApiTags('action-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActionItemController {
  constructor(private actionItemService: ActionItemService) {}

  @Post('completions')
  @ApiOperation({ summary: 'Complete an action item' })
  @ApiResponse({ status: 201, description: 'Action item completed successfully.' })
  async completeActionItem(@Body() createCompletionDto: CreateCompletionDto) {
    return await this.actionItemService.completeActionItem(createCompletionDto);
  }

  @Get(':id/completions')
  @ApiOperation({ summary: 'Get completions for an action item' })
  @ApiResponse({ status: 200, description: 'Completions retrieved successfully.' })
  async getActionItemCompletions(@Param('id') actionItemId: string, @Query('clientId') clientId?: string) {
    return await this.actionItemService.getActionItemCompletions(actionItemId, clientId);
  }

  @Get('completions/client/:clientId')
  @ApiOperation({ summary: 'Get all completions for a client' })
  @ApiResponse({ status: 200, description: 'Client completions retrieved successfully.' })
  async getClientCompletions(@Param('clientId') clientId: string, @Query('planId') planId?: string) {
    return await this.actionItemService.getClientCompletions(clientId, planId);
  }

  @Put('completions/:id')
  @ApiOperation({ summary: 'Update a completion' })
  @ApiResponse({ status: 200, description: 'Completion updated successfully.' })
  async updateCompletion(@Param('id') completionId: string, @Body() updateData: Partial<CreateCompletionDto>) {
    return await this.actionItemService.updateCompletion(completionId, updateData);
  }

  @Delete('completions/:id')
  @ApiOperation({ summary: 'Delete a completion' })
  @ApiResponse({ status: 200, description: 'Completion deleted successfully.' })
  async deleteCompletion(@Param('id') completionId: string) {
    return await this.actionItemService.deleteCompletion(completionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get action item by ID' })
  @ApiResponse({ status: 200, description: 'Action item retrieved successfully.' })
  async getActionItemById(@Param('id') actionItemId: string) {
    return await this.actionItemService.getActionItemById(actionItemId);
  }
}
