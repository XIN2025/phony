import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateJournalEntryDto {
  clientId: string;
  title: string;
  content: string;
}

interface UpdateJournalEntryDto {
  title?: string;
  content?: string;
}

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async createJournalEntry(data: CreateJournalEntryDto) {
    return await this.prisma.journalEntry.create({
      data: {
        clientId: data.clientId,
        title: data.title,
        content: data.content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getJournalEntries(clientId: string) {
    return await this.prisma.journalEntry.findMany({
      where: {
        clientId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJournalEntryById(entryId: string, clientId?: string) {
    return await this.prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        ...(clientId && { clientId }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateJournalEntry(entryId: string, data: UpdateJournalEntryDto, clientId?: string) {
    return await this.prisma.journalEntry.update({
      where: {
        id: entryId,
        ...(clientId && { clientId }),
      },
      data: {
        title: data.title,
        content: data.content,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteJournalEntry(entryId: string, clientId?: string) {
    return await this.prisma.journalEntry.delete({
      where: {
        id: entryId,
        ...(clientId && { clientId }),
      },
    });
  }

  async getClientJournalEntries(clientId: string, practitionerId?: string) {
    if (practitionerId) {
      const client = await this.prisma.user.findFirst({
        where: {
          id: clientId,
          practitionerId: practitionerId,
        },
      });
      if (!client) {
        throw new Error('Client not found or not authorized');
      }
    }

    return await this.prisma.journalEntry.findMany({
      where: {
        clientId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchJournalEntries(clientId: string, searchTerm: string) {
    return await this.prisma.journalEntry.findMany({
      where: {
        clientId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
