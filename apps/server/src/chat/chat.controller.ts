// src/chat/chat.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('chats')
@ApiTags('chats')
@Public()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats' })
  @ApiResponse({ status: 200, description: 'List of all chats.' })
  async getAllChats() {
    return await this.chatService.getAllChats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by id' })
  @ApiResponse({ status: 200, description: 'Chat by id.' })
  async getChatById(@Param('id') id: string) {
    return await this.chatService.getChatById(id);
  }

  @Get('client/:id')
  @ApiOperation({ summary: 'Get chat by client id' })
  @ApiResponse({ status: 200, description: 'Chat by client id.' })
  async getChatByClientId(@Param('id') id: string) {
    if (!id) {
      return { error: 'Client id is required' };
    }
    const chat = await this.chatService.getChatByClientId(id);
    if (!chat) {
      return { error: 'Chat not found' };
    }
    return chat;
  }

  @Get('practitioner/:id')
  @ApiOperation({ summary: 'Get chat by practitioner id' })
  @ApiResponse({ status: 200, description: 'Chat by practitioner id.' })
  async getChatByPractitionerId(@Param('id') id: string) {
    if (!id) {
      return { error: 'Practitioner id is required' };
    }
    const chat = await this.chatService.getChatByPractitionerId(id);
    if (!chat) {
      return { error: 'Chat not found' };
    }
    return chat;
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all chat messages' })
  @ApiResponse({ status: 200, description: 'Chat messages.' })
  async getChatMessages(@Param('id') chatId: string) {
    return await this.chatService.getChatMessages(chatId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created.' })
  async createChat(@Body() body: { clientId: string; practitionerId: string }) {
    return await this.chatService.createChat(body.clientId, body.practitionerId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'create new message' })
  @ApiResponse({ status: 201, description: 'Message saved.' })
  async saveMessage(@Param('id') chatId: string, @Body() body: { senderId: string; message: string }) {
    const data = {
      chatId: chatId,
      senderId: body.senderId,
      message: body.message,
    };
    return await this.chatService.saveMessage(data);
  }
}
