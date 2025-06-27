import { Controller, Post, Get, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { PractitionerService } from './practitioner.service';
import { InviteClientDto } from '@repo/shared-types/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';

@ApiTags('practitioner')
@Controller('practitioner')
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

  @Post('invite-client')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invite a client to the platform' })
  @ApiResponse({ status: 201, description: 'Client invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - client already exists or invitation already sent' })
  @ApiResponse({ status: 404, description: 'Practitioner not found' })
  async inviteClient(@Request() req, @Body() inviteData: InviteClientDto) {
    const practitionerId = req.user.id;
    return this.practitionerService.inviteClient(practitionerId, inviteData);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all invitations sent by the practitioner' })
  @ApiResponse({ status: 200, description: 'List of invitations retrieved successfully' })
  async getInvitations(@CurrentUser() user: RequestUser) {
    return this.practitionerService.getInvitations(user.id);
  }

  @Post('invitations/:id/resend')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resend a specific invitation' })
  @ApiResponse({ status: 201, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async resendInvitation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.practitionerService.resendInvitation(user.id, id);
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a specific invitation' })
  @ApiResponse({ status: 200, description: 'Invitation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - invitation does not belong to practitioner' })
  async deleteInvitation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.practitionerService.deleteInvitation(user.id, id);
  }

  @Post('invitations/cleanup-expired')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cleanup expired invitations' })
  @ApiResponse({ status: 200, description: 'Expired invitations cleaned up successfully' })
  async cleanupExpiredInvitations(@CurrentUser() user: RequestUser) {
    return this.practitionerService.cleanupExpiredInvitations(user.id);
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all clients of the practitioner' })
  @ApiResponse({ status: 200, description: 'List of clients retrieved successfully' })
  async getClients(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.getClients(practitionerId);
  }
}
