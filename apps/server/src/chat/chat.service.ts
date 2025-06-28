import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

interface SendMessageData {
  conversationId: string;
  authorId: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  readAt?: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl?: string;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        practitionerId: true,
        avatarUrl: true,
      },
    });
  }

  async getOrCreateConversation(practitionerId: string, clientId: string) {
    const practitioner = await this.prisma.user.findUnique({ where: { id: practitionerId } });
    const client = await this.prisma.user.findUnique({ where: { id: clientId } });

    if (!practitioner) {
      throw new NotFoundException(`Practitioner with ID ${practitionerId} not found`);
    }
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        practitionerId,
        clientId,
      },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profession: true,
            avatarUrl: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          practitionerId,
          clientId,
        },
        include: {
          practitioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              profession: true,
              avatarUrl: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    return conversation;
  }

  async createMessage(conversationId: string, authorId: string, content: string): Promise<ChatMessage> {
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversationId,
        authorId: authorId,
        content: content,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      this.logger.warn('Could not update conversation timestamp:', error.message);
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      authorId: message.authorId,
      content: message.content,
      createdAt: message.createdAt,
      readAt: message.readAt ?? undefined,
      author: {
        id: message.author.id,
        firstName: message.author.firstName,
        lastName: message.author.lastName,
        role: message.author.role,
        avatarUrl: message.author.avatarUrl ?? undefined,
      },
    };
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      authorId: message.authorId,
      content: message.content,
      createdAt: message.createdAt,
      readAt: message.readAt ?? undefined,
      reactions: message.reactions,
      author: {
        id: message.author.id,
        firstName: message.author.firstName,
        lastName: message.author.lastName,
        role: message.author.role,
        avatarUrl: message.author.avatarUrl ?? undefined,
      },
    }));
  }

  async getConversationsByPractitioner(practitionerId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { practitionerId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorId: true,
            readAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conversation) => ({
      ...conversation,
      lastMessageAt: conversation.messages[0]?.createdAt || null,
    }));
  }

  async getConversationsByClient(clientId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { clientId },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            profession: true,
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorId: true,
            readAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => ({
      ...c,
      lastMessageAt: c.messages[0]?.createdAt || null,
    }));
  }

  async getConversationById(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        practitioner: true,
        client: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return conversation;
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    return await this.prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        authorId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async addReactionToMessage(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    const reaction = await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      ...reaction,
      message: {
        conversationId: message.conversationId,
      },
    };
  }

  async removeReactionFromMessage(messageId: string, userId: string, emoji: string) {
    return await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async getMessageReactions(messageId: string) {
    return await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMessageById(messageId: string) {
    return await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
      },
    });
  }
}
