// src/chat/chat.gateway.ts
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
import { ChatService } from './chat.service';

interface JoinRoomData {
  chatId: string;
  userId: string;
  userType: 'client' | 'practitioner';
}

interface SendMessageData {
  chatId: string;
  userId: string;
  userType: 'client' | 'practitioner';
  message: string;
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

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomData) {
    const { chatId, userId, userType } = data;

    // Join the room
    client.join(chatId);

    // Store user info in socket
    client.data.userId = userId;
    client.data.userType = userType;
    client.data.chatId = chatId;

    // Get chat history
    const messages = await this.chatService.getChatMessages(chatId);

    // Send chat history to the user
    client.emit('chatHistory', messages);

    // Notify others in the room
    client.to(chatId).emit('userJoined', {
      userId,
      userType,
      message: `${userType} has joined the chat`,
    });

    console.log(`User ${userId} (${userType}) joined room ${chatId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: SendMessageData) {
    const { chatId, userId, message } = data;

    // Save message to database
    const savedMessage = await this.chatService.saveMessage({
      chatId,
      senderId: userId,
      message,
    });
    this.server.to(chatId).emit('newMessage', savedMessage);

    console.log(`Message sent in room ${chatId} by ${userId}: ${message}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const { chatId, userId, userType } = client.data;

    if (chatId) {
      client.leave(chatId);
      client.to(chatId).emit('userLeft', {
        userId,
        userType,
        message: `${userType} has left the chat`,
      });
    }
  }
}
