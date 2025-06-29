import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@repo/db';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany();
  }

  async getUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(userData: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profession: userData.profession || null,
        practitionerId: userData.practitionerId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isEmailVerified: false,
      },
    });
    return user;
  }

  async updateUser(id: string, userData: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        updatedAt: new Date(),
      },
    });
  }

  async deleteUser(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getAllPractitioner() {
    return await this.prisma.user.findMany({
      where: {
        role: UserRole.PRACTITIONER,
      },
    });
  }

  async getAllClient() {
    return await this.prisma.user.findMany({
      where: {
        role: UserRole.CLIENT,
      },
    });
  }
}
