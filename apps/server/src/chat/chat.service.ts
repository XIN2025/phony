// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface MessageData {
  chatId: string;
  senderId: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(clientId: string, practitionerId: string) {
    try {
      const chat = await this.prisma.chats.create({
        data: {
          clientId: clientId,
          practitionerId: practitionerId,
        },
      });
      return chat;
    } catch (error) {
      // If chat already exists, return the existing one
      const existingChat = await this.prisma.chats.findFirst({
        where: {
          clientId: clientId,
          practitionerId: practitionerId,
        },
      });
      return existingChat;
    }
  }

  async saveMessage(data: MessageData): Promise<ChatMessage> {
    const created = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        content: data.message,
      },
    });

    // Return a ChatMessage object
    return {
      id: created.id,
      chatId: created.chatId,
      senderId: created.senderId,
      message: created.content,
      timestamp: created.createdAt,
    };
  }

  async getChatMessages(chatId: string) {
    return await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllChats() {
    return await this.prisma.chats.findMany();
  }

  async getChatById(id: string) {
    return await this.prisma.chats.findUnique({
      where: { id },
    });
  }

  async getChatByClientId(clientId: string) {
    return await this.prisma.chats.findFirst({
      where: { clientId },
      select: {
        id: true,
        practitionerId: true,
        clientId: true,
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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

  async getChatByPractitionerId(practitionerId: string) {
    return await this.prisma.chats.findFirst({
      where: { practitionerId },
      select: {
        id: true,
        practitionerId: true,
        clientId: true,
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
}
