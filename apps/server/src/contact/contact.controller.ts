import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContactService, ContactFormData } from './contact.service';
import { Public } from '../auth/decorators/public.decorator';
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit contact form' })
  @ApiResponse({ status: 200, description: 'Contact form submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid form data.' })
  async submitContactForm(@Body() contactData: ContactFormDto): Promise<{ success: boolean; message: string }> {
    const result = await this.contactService.submitContactForm(contactData);

    if (result.success) {
      return {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
      };
    } else {
      return {
        success: false,
        message: 'Failed to send your message. Please try again later.',
      };
    }
  }
}
