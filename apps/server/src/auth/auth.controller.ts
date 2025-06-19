import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginResponseDto, OtpAuthDto, VerifyOtpDto } from './dto/auth.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/api/auth')
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
}
