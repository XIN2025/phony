import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { QuestionType } from '@repo/db';
import { IntakeFormSeederService } from './intake-form/intake-form-seeder.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly intakeFormSeederService: IntakeFormSeederService
  ) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('seed-templates')
  @Public()
  async seedTemplates() {
    return await this.intakeFormSeederService.seedTemplates();
  }
}
