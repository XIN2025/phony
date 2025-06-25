import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { config } from 'src/common/config';
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
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
      },
      defaults: {
        from: config.mail.defaults.from,
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
