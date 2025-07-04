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
    @Body() createSessionDto: { clientId: string; title: string; notes?: string },
    @CurrentUser() user: RequestUser
  ) {
    return await this.sessionService.createSession(
      user.id,
      createSessionDto.clientId,
      createSessionDto.title,
      createSessionDto.notes
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
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Audio uploaded successfully.' })
  async uploadAudio(@Param('id') sessionId: string, @UploadedFile() file: Express.Multer.File) {
    // We'll construct the URL to be stored in the database
    const audioFileUrl = `/uploads/${file.filename}`;
    return await this.sessionService.addAudioToSession(sessionId, audioFileUrl);
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
