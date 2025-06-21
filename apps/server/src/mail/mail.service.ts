import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { config } from 'src/common/config';
import { Template, templates, TemplateContextMap } from './templates';

/**
 * Service responsible for handling all email-related operations.
 * Provides functionality for sending regular emails, template-based emails, and emails with attachments.
 *
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private mailService: MailService) {}
 *
 * // Send a simple email
 * await mailService.sendMail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   text: 'Hello World!'
 * });
 * ```
 */
@Injectable()
export class MailService {
  /**
   * Creates an instance of MailService.
   * @param mailerService - The NestJS mailer service for sending emails
   */
  constructor(private mailerService: MailerService) {}

  /**
   * Sends an email using the configured transporter.
   *
   * @param options - The email options
   * @param options.to - Recipient email address(es)
   * @param options.subject - Email subject line
   * @param options.text - Plain text content of the email (optional)
   * @param options.html - HTML content of the email (optional)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * const sent = await mailService.sendMail({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   html: '<h1>Welcome to our platform!</h1>'
   * });
   * ```
   */
  public async sendMail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Sends an email using a predefined template.
   * Provides type safety for template context based on the selected template.
   *
   * @template T - The template name (must be a key of available templates)
   * @param options - The template email options
   * @param options.to - Recipient email address(es)
   * @param options.subject - Email subject line
   * @param options.templateName - Name of the template to use
   * @param options.context - Context data for the template (type-safe based on template)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * // Sending an OTP email (type-safe context)
   * await mailService.sendTemplateMail({
   *   to: 'user@example.com',
   *   subject: 'Your OTP',
   *   templateName: 'OTP',
   *   context: {
   *     otp: '123456',
   *     validity: 5
   *   }
   * });
   * ```
   */
  async sendTemplateMail<T extends Template>(options: {
    to: string | string[];
    subject: string;
    templateName: T;
    context: TemplateContextMap[T];
  }): Promise<boolean> {
    const html = this.renderTemplate(templates[options.templateName], options.context);
    return this.sendMail({
      to: options.to,
      subject: options.subject,
      html,
    });
  }

  /**
   * Sends an email with file attachments.
   *
   * @param options - The email options with attachments
   * @param options.to - Recipient email address(es)
   * @param options.subject - Email subject line
   * @param options.text - Plain text content of the email (optional)
   * @param options.html - HTML content of the email (optional)
   * @param options.attachments - Array of file attachments (optional)
   * @param options.attachments[].filename - Name of the attached file
   * @param options.attachments[].content - Content of the file (Buffer or string)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * await mailService.sendMailWithAttachment({
   *   to: 'user@example.com',
   *   subject: 'Your Invoice',
   *   text: 'Please find your invoice attached.',
   *   attachments: [{
   *     filename: 'invoice.pdf',
   *     content: Buffer.from('...') // PDF content
   *   }]
   * });
   * ```
   */
  async sendMailWithAttachment(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
    }>;
  }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: `"${config.mail.defaults.fromName}" <${config.mail.smtp.auth.user}>`,
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email with attachment:', error);
      return false;
    }
  }

  /**
   * Sends a client invitation email.
   *
   * @param options - The invitation email options
   * @param options.to - Client's email address
   * @param options.clientName - Client's full name
   * @param options.practitionerName - Practitioner's name
   * @param options.invitationLink - Secure invitation link
   * @param options.intakeFormTitle - Title of the intake form (optional)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   */
  async sendClientInvitation(options: {
    to: string;
    clientName: string;
    practitionerName: string;
    invitationLink: string;
    intakeFormTitle?: string;
  }): Promise<boolean> {
    console.log(`[MailService] Attempting to send client invitation to ${options.to}`);
    console.log(`[MailService] Mail config:`, {
      host: config.mail.smtp.host,
      port: config.mail.smtp.port,
      user: config.mail.smtp.auth.user,
      from: config.mail.defaults.from,
      fromName: config.mail.defaults.fromName,
    });

    const subject = `Invitation from ${options.practitionerName} - Join Continuum`;

    try {
      // Use the template system like OTP emails
      const context: {
        clientName: string;
        practitionerName: string;
        invitationLink: string;
        intakeFormTitle: string;
      } = {
        clientName: options.clientName,
        practitionerName: options.practitionerName,
        invitationLink: options.invitationLink,
        intakeFormTitle: '',
      };

      // Only add intake form title if it exists and is not empty
      if (options.intakeFormTitle && options.intakeFormTitle.trim()) {
        context.intakeFormTitle = `<p><strong>Intake Form:</strong> ${options.intakeFormTitle}</p>`;
      } else {
        context.intakeFormTitle = '';
      }

      const result = await this.sendTemplateMail({
        to: options.to,
        subject,
        templateName: 'CLIENT_INVITATION',
        context,
      });

      if (result) {
        console.log(`[MailService] Client invitation email sent successfully to ${options.to}`);
      } else {
        console.error(
          `[MailService] Failed to send client invitation email to ${options.to} - sendTemplateMail returned false`
        );
      }

      return result;
    } catch (error) {
      console.error(`[MailService] Error sending client invitation email to ${options.to}:`, error);
      return false;
    }
  }

  private renderTemplate<T extends Template>(template: string, context: TemplateContextMap[T]): string {
    let rendered = template;
    Object.entries(context).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    return rendered;
  }
}
