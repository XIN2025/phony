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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { IntakeFormService } from './intake-form.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateIntakeFormDto } from '@repo/shared-types';
import { FileInterceptor } from '@nestjs/platform-express';
import { saveFileToUploads, validateFileUpload, generateUniqueFilename } from '../common/utils/user.utils';

@ApiTags('intake-forms')
@Controller('intake-forms')
@ApiBearerAuth()
export class IntakeFormController {
  constructor(private readonly intakeFormService: IntakeFormService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new intake form' })
  @ApiResponse({ status: 201, description: 'The form has been successfully created.' })
  create(@Request() req, @Body() createIntakeFormDto: CreateIntakeFormDto) {
    const practitionerId = req.user.id;
    return this.intakeFormService.createIntakeForm(practitionerId, createIntakeFormDto);
  }

  @Post('upload-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file for an intake form answer' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  async uploadIntakeFormFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }
    const { isValid, error } = validateFileUpload(file);
    if (!isValid) {
      throw new Error(error || 'Invalid file upload');
    }
    const filename = generateUniqueFilename(file.originalname);
    const url = await saveFileToUploads(file, filename, 'uploads');
    return { url, title: file.originalname };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all intake forms for the logged-in practitioner' })
  @ApiResponse({ status: 200, description: 'List of intake forms.' })
  findAll(@Request() req) {
    const practitionerId = req.user.id;
    return this.intakeFormService.getIntakeFormsByPractitioner(practitionerId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific intake form by ID' })
  @ApiResponse({ status: 200, description: 'The intake form.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.intakeFormService.getIntakeFormById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an intake form' })
  @ApiResponse({ status: 200, description: 'The form has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Request() req, @Param('id') id: string, @Body() updateIntakeFormDto: CreateIntakeFormDto) {
    const practitionerId = req.user.id;
    return this.intakeFormService.updateIntakeForm(id, practitionerId, updateIntakeFormDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an intake form' })
  @ApiResponse({ status: 204, description: 'The form has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Request() req, @Param('id') id: string) {
    const practitionerId = req.user.id;
    return this.intakeFormService.deleteIntakeForm(id, practitionerId);
  }
}
