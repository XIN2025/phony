import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessage } from './chat.service';
import { MessageReaction } from '@repo/db';

interface ReactionBroadcast extends MessageReaction {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  message: {
    conversationId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private connectedUsers = new Map<string, Set<string>>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log('Client connected:', client.id);

    const directUserId = client.handshake.auth?.userId;
    const token = client.handshake.auth?.token;

    let userId: string | null = null;

    if (directUserId) {
      this.logger.log('Using direct user ID:', directUserId);
      userId = directUserId;
    } else if (token) {
      this.logger.log('Extracting user ID from token');
      userId = this.extractUserIdFromToken(token);
    } else {
      this.logger.warn('No user ID or token provided in connection');
    }

    if (userId) {
      this.logger.log(`User authenticated: ${userId}`);
      client.data.userId = userId;
      this.addUserConnection(userId, client.id);
      this.broadcastUserStatus(userId, 'online');
    } else {
      this.logger.warn('Could not determine user ID from connection');
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected:', client.id);

    const userId = client.data.userId;
    if (userId) {
      this.removeUserConnection(userId, client.id);

      if (!this.connectedUsers.has(userId) || this.connectedUsers.get(userId)?.size === 0) {
        this.broadcastUserStatus(userId, 'offline');
      }
    }
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      this.logger.log('Extracting user ID from token');

      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length !== 3) {
          this.logger.warn('Invalid JWT format');
          return null;
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        this.logger.log('JWT payload keys:', Object.keys(payload));

        const userId =
          payload.sub ||
          payload.userId ||
          payload.id ||
          payload.user?.id ||
          payload.user_id ||
          payload.email ||
          payload.data?.id ||
          payload.data?.userId;

        this.logger.log('Extracted user ID:', userId);
        return userId || null;
      } else {
        this.logger.log('Using simple token as user ID');
        return token;
      }
    } catch (error) {
      this.logger.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const userConnections = this.connectedUsers.get(userId);
    if (userConnections) {
      userConnections.delete(socketId);
      if (userConnections.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.server.emit('userStatusChange', { userId, status, timestamp: new Date() });
  }

  private isUserOnline(userId: string): boolean {
    const userConnections = this.connectedUsers.get(userId);
    return userConnections ? userConnections.size > 0 : false;
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    try {
      await client.join(data.conversationId);
      this.logger.log(`Client joined conversation: ${data.conversationId}`);
    } catch (error) {
      this.logger.error('Failed to join conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    try {
      await client.leave(data.conversationId);
      this.logger.log(`Client left conversation: ${data.conversationId}`);
    } catch (error) {
      this.logger.error('Error leaving conversation:', error);
    }
  }

  sendMessageToConversation(conversationId: string, message: ChatMessage) {
    this.server.to(conversationId).emit('newMessage', message);
  }

  sendReactionToConversation(conversationId: string, reaction: ReactionBroadcast) {
    this.server.to(conversationId).emit('reactionAdded', reaction);
  }

  removeReactionFromConversation(
    conversationId: string,
    reactionIdentifier: { messageId: string; userId: string; emoji: string }
  ) {
    this.server.to(conversationId).emit('reactionRemoved', reactionIdentifier);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean; userId: string }
  ) {
    try {
      client.to(data.conversationId).emit('userTyping', {
        userId: data.userId,
        isTyping: data.isTyping,
        conversationId: data.conversationId,
      });
    } catch (error) {
      this.logger.error('Error handling typing event:', error);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string }
  ) {
    try {
      await this.chatService.markMessagesAsRead(data.conversationId, data.userId);
      client.to(data.conversationId).emit('messagesRead', {
        conversationId: data.conversationId,
        userId: data.userId,
      });
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
    }
  }

  @SubscribeMessage('getUserStatus')
  handleGetUserStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    const isOnline = this.isUserOnline(data.userId);
    client.emit('userStatus', {
      userId: data.userId,
      status: isOnline ? 'online' : 'offline',
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', {
      userIds: onlineUserIds,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('userConnected')
  handleUserConnected(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    this.logger.log(`User explicitly connected: ${data.userId}`);

    if (data.userId && client.data.userId === data.userId) {
      this.addUserConnection(data.userId, client.id);

      this.broadcastUserStatus(data.userId, 'online');

      const onlineUserIds = Array.from(this.connectedUsers.keys());
      client.emit('onlineUsers', {
        userIds: onlineUserIds,
        timestamp: new Date(),
      });
    }
  }
}
