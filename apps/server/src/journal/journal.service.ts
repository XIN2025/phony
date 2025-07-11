import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateJournalEntryDto {
  clientId: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
}

interface UpdateJournalEntryDto {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
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
        mood: data.mood,
        tags: data.tags || [],
        isPrivate: data.isPrivate || false,
      },
      include: {
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

  async getJournalEntries(clientId: string, includePrivate: boolean = true) {
    return await this.prisma.journalEntry.findMany({
      where: {
        clientId,
        ...(includePrivate ? {} : { isPrivate: false }),
      },
      include: {
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
      include: {
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
        mood: data.mood,
        tags: data.tags,
        isPrivate: data.isPrivate,
        updatedAt: new Date(),
      },
      include: {
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
    // If practitionerId is provided, verify the client belongs to this practitioner
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
        isPrivate: false, // Practitioners can only see public entries
      },
      include: {
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

  async searchJournalEntries(clientId: string, searchTerm: string, includePrivate: boolean = true) {
    return await this.prisma.journalEntry.findMany({
      where: {
        clientId,
        ...(includePrivate ? {} : { isPrivate: false }),
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm] } },
        ],
      },
      include: {
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
