import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { config } from 'src/common/config';
import { MailModule } from 'src/mail/mail.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.jwt.secret,
      signOptions: { expiresIn: config.jwt.expiresIn },
    }),
    MailModule,
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
