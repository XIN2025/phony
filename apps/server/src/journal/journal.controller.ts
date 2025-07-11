import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JournalService } from './journal.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';

interface CreateJournalEntryDto {
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
}

interface UpdateJournalEntryDto {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
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
  async getJournalEntries(@CurrentUser() user: RequestUser, @Query('includePrivate') includePrivate?: string) {
    const includePrivateBool = includePrivate === 'true';
    return await this.journalService.getJournalEntries(user.id, includePrivateBool);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search journal entries' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully.' })
  async searchJournalEntries(
    @CurrentUser() user: RequestUser,
    @Query('q') searchTerm: string,
    @Query('includePrivate') includePrivate?: string
  ) {
    const includePrivateBool = includePrivate === 'true';
    return await this.journalService.searchJournalEntries(user.id, searchTerm, includePrivateBool);
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

  // Practitioner endpoints
  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get journal entries for a specific client (practitioner only)' })
  @ApiResponse({ status: 200, description: 'Client journal entries retrieved successfully.' })
  async getClientJournalEntries(@Param('clientId') clientId: string, @CurrentUser() user: RequestUser) {
    if (user.role !== 'PRACTITIONER') {
      throw new Error('Unauthorized: Only practitioners can access client journal entries');
    }
    return await this.journalService.getClientJournalEntries(clientId, user.id);
  }
}
