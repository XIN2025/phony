import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ActionItemService } from './action-item.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateActionItemDto, UpdateActionItemDto, CreateCompletionDto, UpdateCompletionDto } from './dto';

@Controller('action-items')
@ApiTags('action-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActionItemController {
  constructor(private actionItemService: ActionItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new action item' })
  @ApiResponse({ status: 201, description: 'Action item created successfully.' })
  createActionItem(@Body() createActionItemDto: CreateActionItemDto) {
    return this.actionItemService.createActionItem(createActionItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all action items' })
  @ApiResponse({ status: 200, description: 'Action items retrieved successfully.' })
  getAllActionItems() {
    return this.actionItemService.getAllActionItems();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get action item by ID' })
  @ApiResponse({ status: 200, description: 'Action item retrieved successfully.' })
  getActionItemById(@Param('id') actionItemId: string) {
    return this.actionItemService.getActionItemById(actionItemId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an action item' })
  @ApiResponse({ status: 200, description: 'Action item updated successfully.' })
  updateActionItem(@Param('id') actionItemId: string, @Body() updateActionItemDto: UpdateActionItemDto) {
    return this.actionItemService.updateActionItem(actionItemId, updateActionItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an action item' })
  @ApiResponse({ status: 200, description: 'Action item deleted successfully.' })
  deleteActionItem(@Param('id') actionItemId: string) {
    return this.actionItemService.deleteActionItem(actionItemId);
  }

  @Post('completions')
  @ApiOperation({ summary: 'Complete an action item' })
  @ApiResponse({ status: 201, description: 'Action item completed successfully.' })
  completeActionItem(@Body() createCompletionDto: CreateCompletionDto) {
    return this.actionItemService.completeActionItem(createCompletionDto);
  }

  @Get(':id/completions')
  @ApiOperation({ summary: 'Get completions for an action item' })
  @ApiResponse({ status: 200, description: 'Completions retrieved successfully.' })
  getActionItemCompletions(@Param('id') actionItemId: string, @Query('clientId') clientId?: string) {
    return this.actionItemService.getActionItemCompletions(actionItemId, clientId);
  }

  @Get('completions/client/:clientId')
  @ApiOperation({ summary: 'Get all completions for a client' })
  @ApiResponse({ status: 200, description: 'Client completions retrieved successfully.' })
  getClientCompletions(@Param('clientId') clientId: string, @Query('planId') planId?: string) {
    return this.actionItemService.getClientCompletions(clientId, planId);
  }

  @Put('completions/:id')
  @ApiOperation({ summary: 'Update a completion' })
  @ApiResponse({ status: 200, description: 'Completion updated successfully.' })
  updateCompletion(@Param('id') completionId: string, @Body() updateCompletionDto: UpdateCompletionDto) {
    return this.actionItemService.updateCompletion(completionId, updateCompletionDto);
  }

  @Delete('completions/:id')
  @ApiOperation({ summary: 'Delete a completion' })
  @ApiResponse({ status: 200, description: 'Completion deleted successfully.' })
  deleteCompletion(@Param('id') completionId: string) {
    return this.actionItemService.deleteCompletion(completionId);
  }
}
