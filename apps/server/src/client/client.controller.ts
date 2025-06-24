import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';

interface SubmitIntakeFormDto {
  formId: string;
  answers: Record<string, unknown>;
}

@ApiTags('client')
@Controller('client')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('intake-form')
  @ApiOperation({ summary: 'Get intake form for the logged-in client' })
  @ApiResponse({ status: 200, description: 'Intake form retrieved successfully.' })
  async getIntakeForm(@Request() req) {
    const clientId = req.user.id;
    return this.clientService.getIntakeForm(clientId);
  }

  @Post('intake-form/submit')
  @ApiOperation({ summary: 'Submit intake form answers' })
  @ApiResponse({ status: 200, description: 'Intake form submitted successfully.' })
  async submitIntakeForm(@Request() req, @Body() body: SubmitIntakeFormDto) {
    const clientId = req.user.id;
    return this.clientService.submitIntakeForm(clientId, body.formId, body.answers);
  }

  @Post('fix-statuses')
  @ApiOperation({ summary: 'Fix client statuses that are inconsistent with their submissions' })
  @ApiResponse({ status: 200, description: 'Client statuses fixed successfully.' })
  async fixClientStatuses() {
    return this.clientService.fixClientStatuses();
  }
}
