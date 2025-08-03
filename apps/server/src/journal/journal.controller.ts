import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { saveFileToUploads, validateFileUpload } from '../common/utils/user.utils';
import { extname } from 'path';

interface CreateJournalEntryDto {
  title?: string;
  content: string;
}

interface UpdateJournalEntryDto {
  title?: string;
  content?: string;
}

@Controller('journal')
@ApiTags('journal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully.' })
  async createJournalEntry(@Body() data: CreateJournalEntryDto, @CurrentUser() user: RequestUser) {
    return await this.journalService.createJournalEntry({
      clientId: user.id,
      ...data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all journal entries for the current user' })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully.' })
  async getJournalEntries(@CurrentUser() user: RequestUser) {
    return await this.journalService.getJournalEntries(user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search journal entries' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully.' })
  async searchJournalEntries(@CurrentUser() user: RequestUser, @Query('q') searchTerm: string) {
    return await this.journalService.searchJournalEntries(user.id, searchTerm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry retrieved successfully.' })
  async getJournalEntryById(@Param('id') entryId: string, @CurrentUser() user: RequestUser) {
    return await this.journalService.getJournalEntryById(entryId, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry updated successfully.' })
  async updateJournalEntry(
    @Param('id') entryId: string,
    @Body() data: UpdateJournalEntryDto,
    @CurrentUser() user: RequestUser
  ) {
    return await this.journalService.updateJournalEntry(entryId, data, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry deleted successfully.' })
  async deleteJournalEntry(@Param('id') entryId: string, @CurrentUser() user: RequestUser) {
    return await this.journalService.deleteJournalEntry(entryId, user.id);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get journal entries for a specific client (practitioner only)' })
  @ApiResponse({ status: 200, description: 'Client journal entries retrieved successfully.' })
  async getClientJournalEntries(@Param('clientId') clientId: string, @CurrentUser() user: RequestUser) {
    if (user.role !== 'PRACTITIONER') {
      throw new Error('Unauthorized: Only practitioners can access client journal entries');
    }
    return await this.journalService.getClientJournalEntries(clientId, user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a journal entry as read by the current practitioner' })
  @ApiResponse({ status: 200, description: 'Journal entry marked as read successfully.' })
  async markJournalEntryAsRead(@Param('id') entryId: string, @CurrentUser() user: RequestUser) {
    if (user.role !== 'PRACTITIONER') {
      throw new Error('Unauthorized: Only practitioners can mark journal entries as read');
    }
    return await this.journalService.markJournalEntryAsRead(entryId, user.id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image for a journal entry' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully.' })
  async uploadJournalImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }
    const { isValid, error } = validateFileUpload(file);
    if (!isValid) {
      throw new Error(error || 'Invalid file upload');
    }
    const ext = extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      throw new Error('Only JPG, PNG, GIF, and WEBP images are allowed.');
    }
    const filename = `${Date.now()}-${file.originalname}`;
    const url = await saveFileToUploads(file, filename, 'uploads');
    return { url, type: 'IMAGE', title: file.originalname };
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread journal count for the current practitioner' })
  @ApiResponse({ status: 200, description: 'Unread journal count retrieved successfully.' })
  async getUnreadJournalCount(@CurrentUser() user: RequestUser) {
    if (user.role !== 'PRACTITIONER') {
      throw new Error('Unauthorized: Only practitioners can access unread journal count');
    }

    const count = await this.journalService.getUnreadJournalCount(user.id);
    return { count };
  }
}
