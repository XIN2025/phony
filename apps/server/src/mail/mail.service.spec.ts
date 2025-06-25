import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { config } from '../common/config';

describe('MailService', () => {
  let service: MailService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    const emailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      html: '<h1>Test Email</h1>',
    };

    it('should successfully send an email and return true', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMail(emailOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...emailOptions,
      });
    });

    it('should send email to multiple recipients', async () => {
      const multipleRecipientsOptions = {
        ...emailOptions,
        to: ['test1@example.com', 'test2@example.com'],
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMail(multipleRecipientsOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...multipleRecipientsOptions,
      });
    });

    it('should send email with only text content', async () => {
      const textOnlyOptions = {
        to: 'test@example.com',
        subject: 'Text Only Email',
        text: 'This is a text-only email',
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMail(textOnlyOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...textOnlyOptions,
      });
    });

    it('should send email with only HTML content', async () => {
      const htmlOnlyOptions = {
        to: 'test@example.com',
        subject: 'HTML Only Email',
        html: '<h1>HTML Only Email</h1>',
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMail(htmlOnlyOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...htmlOnlyOptions,
      });
    });

    it('should return false when email sending fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const result = await service.sendMail(emailOptions);

      expect(result).toBe(false);
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('Network timeout'));

      const result = await service.sendMail(emailOptions);

      expect(result).toBe(false);
    });
  });

  describe('sendTemplateMail', () => {
    it('should successfully send OTP template email', async () => {
      const otpOptions = {
        to: 'test@example.com',
        subject: 'Your OTP',
        templateName: 'OTP' as const,
        context: {
          otp: '123456',
          validity: 5,
        },
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendTemplateMail(otpOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        to: 'test@example.com',
        subject: 'Your OTP',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send template email to multiple recipients', async () => {
      const otpOptions = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Your OTP',
        templateName: 'OTP' as const,
        context: {
          otp: '123456',
          validity: 5,
        },
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendTemplateMail(otpOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Your OTP',
        html: expect.stringContaining('123456'),
      });
    });

    it('should return false when template email sending fails', async () => {
      const otpOptions = {
        to: 'test@example.com',
        subject: 'Your OTP',
        templateName: 'OTP' as const,
        context: {
          otp: '123456',
          validity: 5,
        },
      };

      mockMailerService.sendMail.mockRejectedValue(new Error('Template Error'));

      const result = await service.sendTemplateMail(otpOptions);

      expect(result).toBe(false);
    });
  });

  describe('sendMailWithAttachment', () => {
    const attachmentOptions = {
      to: 'test@example.com',
      subject: 'Email with Attachment',
      text: 'Please find the attachment',
      attachments: [
        {
          filename: 'document.pdf',
          content: Buffer.from('PDF content'),
        },
      ],
    };

    it('should successfully send email with attachment', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMailWithAttachment(attachmentOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.smtp.auth.user}>`,
        ...attachmentOptions,
      });
    });

    it('should send email with multiple attachments', async () => {
      const multipleAttachmentsOptions = {
        ...attachmentOptions,
        attachments: [
          {
            filename: 'document1.pdf',
            content: Buffer.from('PDF content 1'),
          },
          {
            filename: 'document2.txt',
            content: 'Text content',
          },
        ],
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMailWithAttachment(multipleAttachmentsOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.smtp.auth.user}>`,
        ...multipleAttachmentsOptions,
      });
    });

    it('should send email without attachments', async () => {
      const noAttachmentOptions = {
        to: 'test@example.com',
        subject: 'Email without Attachment',
        text: 'No attachment here',
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendMailWithAttachment(noAttachmentOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: `"${config.mail.defaults.fromName}" <${config.mail.smtp.auth.user}>`,
        ...noAttachmentOptions,
      });
    });

    it('should return false when attachment email sending fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('Attachment Error'));

      const result = await service.sendMailWithAttachment(attachmentOptions);

      expect(result).toBe(false);
    });
  });

  describe('sendClientInvitation', () => {
    const invitationOptions = {
      to: 'client@example.com',
      clientName: 'John Doe',
      practitionerName: 'Dr. Smith',
      invitationLink: 'https://example.com/invite?token=abc123',
      intakeFormTitle: 'Health Assessment',
    };

    it('should successfully send client invitation email', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendClientInvitation(invitationOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: config.mail.defaults.from,
        to: 'client@example.com',
        subject: "You're invited to join Dr. Smith's practice",
        html: expect.stringContaining('John Doe'),
      });
    });

    it('should send invitation without intake form title', async () => {
      const invitationWithoutForm = {
        ...invitationOptions,
        intakeFormTitle: undefined,
      };

      mockMailerService.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendClientInvitation(invitationWithoutForm);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: config.mail.defaults.from,
        to: 'client@example.com',
        subject: "You're invited to join Dr. Smith's practice",
        html: expect.stringContaining('John Doe'),
      });
    });

    it('should handle empty intake form title', async () => {
      const invitationWithEmptyForm = {
        ...invitationOptions,
        intakeFormTitle: '',
      };

      mockMailerService.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendClientInvitation(invitationWithEmptyForm);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: config.mail.defaults.from,
        to: 'client@example.com',
        subject: "You're invited to join Dr. Smith's practice",
        html: expect.stringContaining('John Doe'),
      });
    });

    it('should return false when client invitation email sending fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('Invitation Error'));

      const result = await service.sendClientInvitation(invitationOptions);

      expect(result).toBe(false);
    });

    it('should handle practitioner name fallback', async () => {
      const invitationWithFallback = {
        ...invitationOptions,
        practitionerName: '',
      };

      mockMailerService.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendClientInvitation(invitationWithFallback);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: config.mail.defaults.from,
        to: 'client@example.com',
        subject: "You're invited to join 's practice",
        html: expect.stringContaining('John Doe'),
      });
    });
  });
});
