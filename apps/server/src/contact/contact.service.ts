import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { config } from '../common/config';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(private readonly mailService: MailService) {}

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean }> {
    try {
      const success = await this.mailService.sendTemplateMail({
        to: config.mail.contactEmail || config.mail.defaults.from,
        subject: `New Contact Form Submission from ${data.firstName} ${data.lastName}`,
        templateName: 'CONTACT',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || 'Not provided',
          message: data.message,
        },
      });

      return { success };
    } catch (error) {
      console.error('[ContactService] Failed to send contact email:', error);
      return { success: false };
    }
  }
}
