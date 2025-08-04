import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
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
    @Body() createSessionDto: { clientId: string; title?: string; notes?: string; summaryTitle?: string },
    @CurrentUser() user: RequestUser
  ) {
    // Generate default title if not provided or empty
    let finalTitle = createSessionDto.title;
    if (!finalTitle || finalTitle.trim() === '') {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear().toString().slice(-2);
      finalTitle = `Session ${day}-${month}-${year}`;
    }

    return await this.sessionService.createSession(
      user.id,
      createSessionDto.clientId,
      finalTitle,
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
    @Req() req: { user?: { id: string }; headers: Record<string, string> },
    @Param('id') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { durationSeconds?: string }
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      throw new Error('User authentication required');
    }

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
    @Body() updateData: { aiSummary?: string; notes?: string; summaryTitle?: string; summaryTemplate?: string }
  ) {
    return await this.sessionService.updateSession(sessionId, updateData);
  }

  @Post('client/:clientId/comprehensive-summary')
  @ApiOperation({ summary: 'Generate comprehensive summary for client' })
  @ApiResponse({ status: 200, description: 'Comprehensive summary generated successfully.' })
  async generateComprehensiveSummary(
    @Param('clientId') clientId: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    return await this.sessionService.generateComprehensiveSummaryForClient(clientId, start, end);
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
