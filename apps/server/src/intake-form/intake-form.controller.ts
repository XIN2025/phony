import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntakeFormService } from './intake-form.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

@ApiTags('intake-forms')
@Controller('intake-forms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntakeFormController {
  constructor(private readonly intakeFormService: IntakeFormService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new intake form' })
  @ApiResponse({ status: 201, description: 'The form has been successfully created.' })
  create(@Request() req, @Body() createIntakeFormDto: CreateIntakeFormDto) {
    const practitionerId = req.user.id;
    return this.intakeFormService.create(practitionerId, createIntakeFormDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all intake forms for the logged-in practitioner' })
  @ApiResponse({ status: 200, description: 'List of intake forms.' })
  findAll(@Request() req) {
    const practitionerId = req.user.id;
    return this.intakeFormService.findAllForPractitioner(practitionerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific intake form by ID' })
  @ApiResponse({ status: 200, description: 'The intake form.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Request() req, @Param('id') id: string) {
    const practitionerId = req.user.id;
    return this.intakeFormService.findOne(id, practitionerId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an intake form' })
  @ApiResponse({ status: 200, description: 'The form has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Request() req, @Param('id') id: string, @Body() updateIntakeFormDto: CreateIntakeFormDto) {
    const practitionerId = req.user.id;
    return this.intakeFormService.update(id, practitionerId, updateIntakeFormDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an intake form' })
  @ApiResponse({ status: 204, description: 'The form has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Request() req, @Param('id') id: string) {
    const practitionerId = req.user.id;
    return this.intakeFormService.delete(id, practitionerId);
  }
}
