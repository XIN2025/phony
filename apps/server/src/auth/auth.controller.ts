import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
  UploadedFiles,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import {
  LoginResponseDto,
  OtpAuthDto,
  VerifyOtpDto,
  PractitionerSignUpDto,
  ClientSignUpDto,
  ProfileUpdateBody,
} from './dto/auth.dto';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/verify')
  @Public()
  @ApiResponse({ type: LoginResponseDto })
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<LoginResponseDto> {
    return this.authService.verifyOtp(body.email, body.otp, body.role);
  }

  @Post('otp/verify-invitation')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the invitation OTP was verified successfully' })
  async verifyInvitationOtp(
    @Body() body: { email: string; otp: string; invitationToken: string }
  ): Promise<{ success: boolean; invitation: Record<string, unknown> }> {
    return this.authService.verifyInvitationOtp(body.email, body.otp, body.invitationToken);
  }

  @Post('invitation/check-intake-form')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the invitation has an intake form attached' })
  async checkInvitationIntakeForm(@Body() body: { invitationToken: string }): Promise<{ hasIntakeForm: boolean }> {
    return this.authService.checkInvitationIntakeForm(body.invitationToken);
  }

  @Post('otp')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the OTP was sent successfully' })
  async otpAuth(@Body() body: OtpAuthDto): Promise<{ success: boolean }> {
    return await this.authService.sendOtp(body.email, body.role);
  }

  @Post('practitioner/signup')
  @Public()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profileImage', maxCount: 1 },
        { name: 'idProof', maxCount: 1 },
      ],
      { storage: memoryStorage() }
    )
  )
  @ApiResponse({ type: LoginResponseDto })
  async practitionerSignUp(
    @Body() body: PractitionerSignUpDto,
    @UploadedFiles() files?: { profileImage?: Express.Multer.File[]; idProof?: Express.Multer.File[] }
  ): Promise<LoginResponseDto> {
    const profileImage = files?.profileImage?.[0];
    const idProof = files?.idProof?.[0];
    return this.authService.handlePractitionerSignUp(body, profileImage, idProof);
  }

  @Post('client/signup')
  @Public()
  @UseInterceptors(FileInterceptor('profileImage', { storage: memoryStorage() }))
  @ApiResponse({ type: LoginResponseDto })
  async clientSignUp(
    @Body() body: ClientSignUpDto,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<LoginResponseDto> {
    return this.authService.handleClientSignUp(body, file);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profileImage', maxCount: 1 },
        { name: 'idProof', maxCount: 1 },
      ],
      { storage: memoryStorage() }
    )
  )
  async updateProfile(
    @Request() req,
    @Body() body: ProfileUpdateBody,
    @UploadedFiles() files?: { profileImage?: Express.Multer.File[]; idProof?: Express.Multer.File[] }
  ) {
    const profileImage = files?.profileImage?.[0];
    const idProof = files?.idProof?.[0];
    return await this.authService.updateProfile(req.user.id, body, profileImage, idProof);
  }

  @Post('otp/verify-only')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the OTP is valid' })
  async verifyOtpOnly(@Body() body: { email: string; otp: string }): Promise<{ success: boolean }> {
    await this.authService.verifyOtpOnly(body.email, body.otp);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully.' })
  async getCurrentUser(@Request() req) {
    const user = await this.authService.getCurrentUser(req.user.id);
    return user;
  }
}
