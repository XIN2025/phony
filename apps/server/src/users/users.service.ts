import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@repo/db';

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

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profession?: string;
    practitionerId?: string;
  }) {
    try {
      // Explicitly avoid transactions by using a simple create operation
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role as UserRole,
          profession: userData.profession || null,
          practitionerId: userData.practitionerId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isEmailVerified: false, // Set to false initially, verify via OTP
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(
    id: string,
    userData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      profession: string;
      practitionerId: string;
      isActive: boolean;
      isEmailVerified: boolean;
    }>
  ) {
    return await this.prisma.user.update({
      where: { id },
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as UserRole,
        profession: userData.profession,
        practitionerId: userData.practitionerId,
        isActive: userData.isActive,
        isEmailVerified: userData.isEmailVerified,
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

  async getAllPractioner() {
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
