import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { ContactService, ContactFormData } from './contact.service';
import { Public } from '../auth/decorators/public.decorator';
import { IsString, IsEmail, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class ContactFormDto {
  @ApiProperty({
    description: 'First name of the person submitting the contact form',
    example: 'John',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the person submitting the contact form',
    example: 'Doe',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the person submitting the contact form',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number (optional)',
    example: '+44 1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Message content from the contact form',
    example: 'I would like to learn more about your services. Please contact me at your earliest convenience.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ContactFormResponseDto {
  @ApiProperty({
    description: 'Whether the contact form was submitted successfully',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Response message indicating success or failure',
    example: 'Thank you for your message! We will get back to you soon.',
  })
  @IsString()
  message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit contact form',
    description: 'Submit a contact form message. The message will be sent to the configured contact email address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact form submitted successfully.',
    type: ContactFormResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid form data.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Validation failed',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async submitContactForm(@Body() contactData: ContactFormDto): Promise<ContactFormResponseDto> {
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
