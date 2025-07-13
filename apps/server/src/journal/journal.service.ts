import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateJournalEntryDto {
  clientId: string;
  title?: string;
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

  async markJournalEntryAsRead(entryId: string, practitionerId: string) {
    try {
      const entry = await this.prisma.journalEntry.findUnique({
        where: { id: entryId },
        select: { id: true, readBy: true },
      });

      if (!entry) {
        throw new Error('Journal entry not found');
      }

      if (!entry.readBy || !entry.readBy.includes(practitionerId)) {
        const updatedReadBy = entry.readBy ? [...entry.readBy, practitionerId] : [practitionerId];

        return await this.prisma.journalEntry.update({
          where: { id: entryId },
          data: {
            readBy: updatedReadBy,
          },
        });
      }

      return entry;
    } catch (error) {
      console.error('Error marking journal entry as read:', error);
      throw error;
    }
  }

  async getUnreadJournalCount(practitionerId: string) {
    try {
      console.log('getUnreadJournalCount called with practitionerId:', practitionerId);

      const clients = await this.prisma.user.findMany({
        where: { practitionerId },
        select: { id: true },
      });

      console.log('Found clients:', clients);

      if (clients.length === 0) return 0;

      const clientIds = clients.map((client) => client.id);
      console.log('Client IDs:', clientIds);

      const allEntries = await this.prisma.journalEntry.findMany({
        where: {
          clientId: { in: clientIds },
        },
        select: { id: true, readBy: true },
      });

      const unreadEntries = allEntries.filter((entry) => !entry.readBy || !entry.readBy.includes(practitionerId));

      console.log('Found total entries:', allEntries.length);
      console.log('Found unread entries:', unreadEntries.length);
      console.log('Returning count:', unreadEntries.length);

      return unreadEntries.length;
    } catch (error) {
      console.error('Error getting unread journal count:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      return 0;
    }
  }
}
