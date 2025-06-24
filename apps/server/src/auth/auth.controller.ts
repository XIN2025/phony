import { Body, Controller, Post, Request, UseGuards, UploadedFile, UseInterceptors, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginResponseDto, OtpAuthDto, VerifyOtpDto, PractitionerSignUpDto } from './dto/auth.dto';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

interface ProfileUpdateBody {
  firstName?: string;
  lastName?: string;
  profession?: string;
  [key: string]: unknown;
}

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
  async otpAuth(@Body() body: OtpAuthDto): Promise<boolean> {
    return this.authService.handleOtpAuth(body.email);
  }

  @Post('practitioner/signup')
  @Public()
  @ApiResponse({ type: LoginResponseDto })
  async practitionerSignUp(@Body() body: PractitionerSignUpDto): Promise<LoginResponseDto> {
    return this.authService.handlePractitionerSignUp(body);
  }

  @Post('client/signup')
  @Public()
  @ApiResponse({ type: LoginResponseDto })
  async clientSignUp(
    @Body() body: { email: string; firstName: string; lastName: string; invitationToken: string }
  ): Promise<LoginResponseDto> {
    console.log('clientSignUp controller received body:', body);
    console.log('Body keys:', Object.keys(body));
    return this.authService.handleClientSignUp(body);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
    })
  )
  async updateProfile(@Request() req, @Body() body: ProfileUpdateBody, @UploadedFile() file: Express.Multer.File) {
    console.log('Profile update request:', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      hasFile: !!file,
      fileInfo: file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hasBuffer: !!file.buffer,
            bufferLength: file.buffer?.length,
          }
        : null,
      body: body,
      contentType: req.headers['content-type'],
    });

    try {
      return await this.authService.updateProfile(req.user.id, body, file);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully.' })
  async getCurrentUser(@Request() req) {
    console.log('getCurrentUser called:', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      headers: req.headers,
    });

    const user = await this.authService.getCurrentUser(req.user.id);

    console.log('getCurrentUser response:', {
      userId: user.id,
      userEmail: user.email,
      clientStatus: user.clientStatus,
    });

    return user;
  }
}
