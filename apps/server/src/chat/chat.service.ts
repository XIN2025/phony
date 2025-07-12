import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

interface SendMessageData {
  conversationId: string;
  authorId: string;
  content: string;
  attachments?: Array<{
    type: 'FILE' | 'LINK' | 'IMAGE';
    url: string;
    title?: string;
    fileName?: string;
    fileSize?: number;
  }>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  readAt?: Date;
  attachments?: Array<{
    id: string;
    type: 'FILE' | 'LINK' | 'IMAGE';
    url: string;
    title?: string;
    fileName?: string;
    fileSize?: number;
    createdAt: Date;
  }>;
  author: {
    id: string;
    firstName: string;
    lastName: string | null;
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
    try {
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
        try {
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
        } catch (createError) {
          if (createError.code === 'P2002') {
            conversation = await this.prisma.conversation.findFirst({
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
          } else {
            throw createError;
          }
        }
      }

      return conversation;
    } catch (error) {
      this.logger.error('Failed to get or create conversation:', error);
      throw error;
    }
  }

  async sendMessage(data: SendMessageData): Promise<ChatMessage> {
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        authorId: data.authorId,
        content: data.content,
        attachments: data.attachments
          ? {
              create: data.attachments.map((attachment) => ({
                type: attachment.type,
                url: attachment.url,
                title: attachment.title,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
              })),
            }
          : undefined,
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
        attachments: true,
      },
    });

    try {
      await this.prisma.conversation.update({
        where: { id: data.conversationId },
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
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        type: attachment.type as 'FILE' | 'LINK' | 'IMAGE',
        url: attachment.url,
        title: attachment.title ?? undefined,
        fileName: attachment.fileName ?? undefined,
        fileSize: attachment.fileSize ?? undefined,
        createdAt: attachment.createdAt,
      })),
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
        attachments: {
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
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        type: attachment.type as 'FILE' | 'LINK' | 'IMAGE',
        url: attachment.url,
        title: attachment.title ?? undefined,
        fileName: attachment.fileName ?? undefined,
        fileSize: attachment.fileSize ?? undefined,
        createdAt: attachment.createdAt,
      })),
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
    const conversationIds = await this.prisma.conversation.findMany({
      where: { practitionerId },
      select: { id: true, clientId: true },
      orderBy: { updatedAt: 'desc' },
    });

    const validClientIds = await this.prisma.user.findMany({
      where: {
        id: { in: conversationIds.map((c) => c.clientId) },
        role: 'CLIENT',
      },
      select: { id: true },
    });

    const validClientIdSet = new Set(validClientIds.map((u) => u.id));
    const validConversationIds = conversationIds.filter((c) => validClientIdSet.has(c.clientId)).map((c) => c.id);

    if (validConversationIds.length === 0) {
      return [];
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        id: { in: validConversationIds },
      },
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
    const conversationIds = await this.prisma.conversation.findMany({
      where: { clientId },
      select: { id: true, practitionerId: true },
      orderBy: { updatedAt: 'desc' },
    });

    const validPractitionerIds = await this.prisma.user.findMany({
      where: {
        id: { in: conversationIds.map((c) => c.practitionerId) },
        role: 'PRACTITIONER',
      },
      select: { id: true },
    });

    const validPractitionerIdSet = new Set(validPractitionerIds.map((u) => u.id));
    const validConversationIds = conversationIds
      .filter((c) => validPractitionerIdSet.has(c.practitionerId))
      .map((c) => c.id);

    if (validConversationIds.length === 0) {
      return [];
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        id: { in: validConversationIds },
      },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
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

  async getConversationById(conversationId: string) {
    return await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
            avatarUrl: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        authorId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
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

    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const result = await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    return result.count > 0;
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
