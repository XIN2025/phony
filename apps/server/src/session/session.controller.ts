import { Controller, Get, Post, Body, Param, Put, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SessionService } from './session.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SessionStatus } from '@repo/db';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('sessions')
@ApiTags('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'Session created successfully.' })
  async createSession(
    @Body() createSessionDto: { clientId: string; title: string; notes?: string; summaryTitle?: string },
    @CurrentUser() user: RequestUser
  ) {
    return await this.sessionService.createSession(
      user.id,
      createSessionDto.clientId,
      createSessionDto.title,
      createSessionDto.notes,
      createSessionDto.summaryTitle
    );
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: 'Upload audio for a session' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
        },
        durationSeconds: {
          type: 'number',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Audio uploaded successfully.' })
  async uploadAudio(
    @Param('id') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { durationSeconds?: string }
  ) {
    if (!file || !file.buffer) {
      throw new Error('No audio file provided or file buffer is empty');
    }

    const durationSeconds = body.durationSeconds ? parseInt(body.durationSeconds, 10) : undefined;

    const validDurationSeconds = durationSeconds && !isNaN(durationSeconds) ? durationSeconds : undefined;

    return await this.sessionService.addAudioToSession(sessionId, file.buffer, validDurationSeconds);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update session details' })
  @ApiResponse({ status: 200, description: 'Session updated successfully.' })
  async updateSession(
    @Param('id') sessionId: string,
    @Body() updateData: { aiSummary?: string; notes?: string; summaryTitle?: string }
  ) {
    return await this.sessionService.updateSession(sessionId, updateData);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update session status' })
  @ApiResponse({ status: 200, description: 'Session status updated successfully.' })
  async updateSessionStatus(
    @Param('id') sessionId: string,
    @Body() body: { status: (typeof SessionStatus)[keyof typeof SessionStatus]; transcript?: string }
  ) {
    return await this.sessionService.updateSessionStatus(sessionId, body.status, body.transcript);
  }

  @Get('practitioner/:id')
  @ApiOperation({ summary: 'Get sessions by practitioner' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully.' })
  async getSessionsByPractitioner(@Param('id') practitionerId: string) {
    return await this.sessionService.getSessionsByPractitioner(practitionerId);
  }

  @Get('practitioner/me')
  @ApiOperation({ summary: 'Get sessions for current practitioner' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully.' })
  async getMySessions(@CurrentUser() user: RequestUser) {
    return await this.sessionService.getSessionsByPractitioner(user.id);
  }

  @Get('client/:id')
  @ApiOperation({ summary: 'Get sessions by client' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully.' })
  async getSessionsByClient(@Param('id') clientId: string) {
    return await this.sessionService.getSessionsByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully.' })
  async getSessionById(@Param('id') sessionId: string) {
    return await this.sessionService.getSessionById(sessionId);
  }
}
