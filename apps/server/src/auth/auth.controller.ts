import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginResponseDto, OtpAuthDto, VerifyOtpDto, PractitionerSignUpDto } from './dto/auth.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @Public()
  @ApiResponse({ type: Boolean, description: 'Whether the OTP was sent successfully' })
  async otpAuth(@Body() body: OtpAuthDto): Promise<boolean> {
    return this.authService.handleOtpAuth(body.email);
  }

  @Post('otp/verify')
  @Public()
  @ApiResponse({ type: LoginResponseDto })
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<LoginResponseDto> {
    return this.authService.verifyOtp(body.email, body.otp, body.role);
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
    @Body() body: { email: string; name: string; invitationToken: string }
  ): Promise<LoginResponseDto> {
    return this.authService.handleClientSignUp(body);
  }
}
