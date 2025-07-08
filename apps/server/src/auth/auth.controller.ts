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
import { LoginResponseDto, OtpAuthDto, VerifyOtpDto, PractitionerSignUpDto, ProfileUpdateBody } from './dto/auth.dto';
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

  @Post('otp')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the OTP was sent successfully' })
  async otpAuth(@Body() body: OtpAuthDto): Promise<{ success: boolean }> {
    return await this.authService.sendOtp(body.email);
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
    @Body() body: { email: string; firstName: string; lastName?: string; invitationToken: string },
    @UploadedFile() file?: Express.Multer.File
  ): Promise<LoginResponseDto> {
    return this.authService.handleClientSignUp(body, file);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
    })
  )
  async updateProfile(@Request() req, @Body() body: ProfileUpdateBody, @UploadedFile() file: Express.Multer.File) {
    return await this.authService.updateProfile(req.user.id, body, file);
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
