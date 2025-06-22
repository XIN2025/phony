import { Controller, Post, Get, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { PractitionerService, InviteClientDto } from './practitioner.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('practitioner')
@Controller('practitioner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PractitionerController {
  constructor(private readonly practitionerService: PractitionerService) {}

  @Public()
  @Get('invitations/token/:token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiResponse({ status: 200, description: 'Invitation details found.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  getInvitationByToken(@Param('token') token: string) {
    return this.practitionerService.getInvitationByToken(token);
  }

  @Public()
  @Get('invitations/debug/:token')
  @ApiOperation({ summary: 'Debug invitation token (for troubleshooting)' })
  @ApiResponse({ status: 200, description: 'Debug information about the token.' })
  async debugInvitationToken(@Param('token') token: string) {
    return this.practitionerService.debugInvitationToken(token);
  }

  @Post('invite-client')
  @ApiOperation({ summary: 'Invite a client to the platform' })
  @ApiResponse({ status: 201, description: 'Client invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - client already exists or invitation already sent' })
  @ApiResponse({ status: 404, description: 'Practitioner not found' })
  async inviteClient(@Request() req, @Body() inviteData: InviteClientDto) {
    const practitionerId = req.user.id;
    return this.practitionerService.inviteClient(practitionerId, inviteData);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get all invitations sent by the practitioner' })
  @ApiResponse({ status: 200, description: 'List of invitations retrieved successfully' })
  async getInvitations(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.getInvitations(practitionerId);
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'Delete a specific invitation' })
  @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - invitation does not belong to practitioner' })
  async deleteInvitation(@Request() req, @Param('id') invitationId: string) {
    const practitionerId = req.user.id;
    return this.practitionerService.deleteInvitation(practitionerId, invitationId);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get all clients of the practitioner' })
  @ApiResponse({ status: 200, description: 'List of clients retrieved successfully' })
  async getClients(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.getClients(practitionerId);
  }
}
