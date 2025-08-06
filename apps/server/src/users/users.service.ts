import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@repo/db';
import { NotFoundException } from '@nestjs/common';

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
    role: (typeof UserRole)[keyof typeof UserRole];
    profession?: string;
    practitionerId?: string;
  }) {
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

  async updateUser(
    id: string,
    userData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      role: (typeof UserRole)[keyof typeof UserRole];
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
        role: userData.role,
        profession: userData.profession,
        practitionerId: userData.practitionerId,
        isActive: userData.isActive,
        isEmailVerified: userData.isEmailVerified,
        updatedAt: new Date(),
      },
    });
  }

  async deleteUser(id: string) {
    // First, get the user to retrieve their email
    const user = await this.prisma.user.findUnique({ where: { id } });
    console.log('[Delete User] Prisma found user:', user);
    if (!user) throw new NotFoundException('User not found');
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    // After deleting the user, reset invitations for this email
    await this.prisma.invitation.updateMany({
      where: {
        clientEmail: user.email,
        status: 'ACCEPTED',
      },
      data: {
        status: 'PENDING',
      },
    });
    return deletedUser;
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

  async updateTrackingSettings(userId: string, trackingEnabled: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        trackingEnabled,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        trackingEnabled: true,
        updatedAt: true,
      },
    });
  }
}
