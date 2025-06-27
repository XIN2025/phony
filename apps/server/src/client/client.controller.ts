import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';

interface SubmitIntakeFormDto {
  formId: string;
  answers: Record<string, unknown>;
}

@ApiTags('client')
@Controller('client')
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('intake-form')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get intake form for client' })
  @ApiResponse({ status: 200, description: 'Intake form retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'No intake form found for client.' })
  async getIntakeForm(@Request() req) {
    const clientId = req.user.id;
    return this.clientService.getIntakeFormForClient(clientId);
  }

  @Post('intake-form/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit intake form answers' })
  @ApiResponse({ status: 200, description: 'Intake form submitted successfully.' })
  async submitIntakeForm(@Request() req, @Body() body: SubmitIntakeFormDto) {
    const clientId = req.user.id;
    return this.clientService.submitIntakeForm(clientId, body.formId, body.answers);
  }

  @Post('fix-statuses')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fix client statuses that are inconsistent with their submissions' })
  @ApiResponse({ status: 200, description: 'Client statuses fixed successfully.' })
  async fixClientStatuses() {
    return this.clientService.fixClientStatuses();
  }
}
