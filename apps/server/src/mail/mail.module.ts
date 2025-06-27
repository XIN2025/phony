import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { config } from '../common/config';

// Create transport configuration based on available credentials
const createTransportConfig = () => {
  // If SMTP credentials are not configured, use a mock transport for development
  if (!config.mail.smtp.auth.user || !config.mail.smtp.auth.pass) {
    return {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: 'test',
        pass: 'test',
      },
    };
  }

  return {
    host: config.mail.smtp.host,
    secure: true,
    port: config.mail.smtp.port,
    auth: {
      user: config.mail.smtp.auth.user,
      pass: config.mail.smtp.auth.pass,
    },
    connectionTimeout: 10000, // 10 seconds to establish connection
    greetingTimeout: 10000, // 10 seconds for SMTP greeting
    socketTimeout: 15000, // 15 seconds for socket operations
  };
};

@Module({
  imports: [
    MailerModule.forRoot({
      transport: createTransportConfig(),
      defaults: {
        from: config.mail.defaults.from || 'noreply@example.com',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
