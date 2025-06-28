import { Controller, Post, Get, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { PractitionerService } from './practitioner.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { InvitationResponseDto } from './dto/invitation.response.dto';

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

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new client' })
  @ApiResponse({
    status: 201,
    description: 'Client invited successfully.',
    type: InvitationResponseDto,
  })
  async inviteClient(@Request() req, @Body() inviteData: InviteClientDto) {
    const practitionerId = req.user.id;
    return this.practitionerService.inviteClient(practitionerId, inviteData);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get all invitations for the practitioner' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully.' })
  async getInvitations(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.getInvitations(practitionerId);
  }

  @Post('invitations/:invitationId/resend')
  @ApiOperation({ summary: 'Resend an invitation to a client' })
  @ApiParam({ name: 'invitationId', description: 'The ID of the invitation to resend' })
  @ApiResponse({
    status: 200,
    description: 'Invitation resent successfully.',
    type: InvitationResponseDto,
  })
  async resendInvitation(@Request() req, @Param('invitationId') invitationId: string) {
    const practitionerId = req.user.id;
    return this.practitionerService.resendInvitation(practitionerId, invitationId);
  }

  @Delete('invitations/:invitationId')
  @ApiOperation({ summary: 'Delete an invitation' })
  @ApiParam({ name: 'invitationId', description: 'The ID of the invitation to delete' })
  @ApiResponse({ status: 200, description: 'Invitation deleted successfully.' })
  async deleteInvitation(@Request() req, @Param('invitationId') invitationId: string) {
    const practitionerId = req.user.id;
    return this.practitionerService.deleteInvitation(practitionerId, invitationId);
  }

  @Get('clients')
  @ApiOperation({ summary: "Get all of the practitioner's clients" })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully.' })
  async getClients(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.getClients(practitionerId);
  }

  @Get('intake-form-submissions/:formId')
  @ApiOperation({ summary: 'Get all submissions for a specific intake form' })
  @ApiParam({ name: 'formId', description: 'The ID of the intake form' })
  @ApiResponse({ status: 200, description: 'Submissions retrieved successfully.' })
  async getIntakeFormSubmissions(@Request() req, @Param('formId') formId: string) {
    const practitionerId = req.user.id;
    return this.practitionerService.getIntakeFormSubmissions(practitionerId, formId);
  }

  @Post('invitations/cleanup')
  @ApiOperation({ summary: 'Cleanup expired invitations' })
  @ApiResponse({ status: 200, description: 'Expired invitations cleaned up successfully.' })
  async cleanupExpiredInvitations(@Request() req) {
    const practitionerId = req.user.id;
    return this.practitionerService.cleanupExpiredInvitations(practitionerId);
  }
}
