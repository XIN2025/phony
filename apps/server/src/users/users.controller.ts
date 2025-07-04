import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@repo/db';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get('practitioner')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all practitioners' })
  @ApiResponse({ status: 200, description: 'List of all practitioners.' })
  async getAllPractitioner() {
    return await this.usersService.getAllPractitioner();
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of all clients.' })
  async getAllClient() {
    return await this.usersService.getAllClient();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'The user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  async createUser(
    @Body()
    userData: {
      email: string;
      firstName: string;
      lastName: string;
      role: (typeof UserRole)[keyof typeof UserRole];
      profession?: string;
      practitionerId?: string;
    }
  ) {
    return await this.usersService.createUser(userData);
  }
}
