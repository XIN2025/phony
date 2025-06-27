import { Controller, Get, Post, Put, Body, Param, Patch, UseGuards } from '@nestjs/common';
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
    source?: ActionItemSource;
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
}
