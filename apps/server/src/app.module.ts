import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PractitionerModule } from './practitioner/practitioner.module';
import { IntakeFormModule } from './intake-form/intake-form.module';
import { ClientModule } from './client/client.module';
import { UsersModule } from './users/users.module';
import { SessionModule } from './session/session.module';
import { PlanModule } from './plan/plan.module';
import { ActionItemModule } from './action-item/action-item.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                hideObject: true,
                ignore: 'pid,hostname',
                messageFormat: '[{req.id}] {req.method} {req.url} - {msg}  {res.statusCode} {responseTime}',
              },
            },
          ],
        },
        redact: ['req.headers', 'res.headers'],
      },
    }),
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    MailModule,
    PractitionerModule,
    IntakeFormModule,
    ClientModule,
    UsersModule,
    SessionModule,
    PlanModule,
    ActionItemModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
