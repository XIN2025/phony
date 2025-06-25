import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('users')
@Controller('users')
@Public()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get('practitioner')
  @ApiOperation({ summary: 'Get all practitioners' })
  @ApiResponse({ status: 200, description: 'List of all practitioners.' })
  async getAllPractioner() {
    return await this.usersService.getAllPractioner();
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of all clients.' })
  async getAllClient() {
    return await this.usersService.getAllClient();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'The user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  async createUser(
    @Body()
    userData: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      profession?: string;
      practitionerId?: string;
    }
  ) {
    return await this.usersService.createUser(userData);
  }
}
