import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto, SendMessageDto, AddReactionDto } from './dto';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequestUser } from '../auth/dto/request-user.dto';

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway
  ) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get conversations for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of conversations.' })
  async getConversations(@CurrentUser() user: RequestUser) {
    const userId = user.id;
    const userRole = user.role;

    if (!userId || !userRole) {
      throw new BadRequestException('User authentication required');
    }

    if (userRole === 'PRACTITIONER') {
      const conversations = await this.chatService.getConversationsByPractitioner(userId);
      return { conversations };
    } else {
      const conversations = await this.chatService.getConversationsByClient(userId);
      return { conversations };
    }
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or get a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation created or retrieved.' })
  async createOrGetConversation(
    @CurrentUser() user: RequestUser,
    @Body() createConversationDto: CreateConversationDto
  ) {
    const { participantId } = createConversationDto;
    if (!participantId) {
      throw new BadRequestException('participantId is required');
    }

    const userId = user.id;
    const userRole = user.role;

    if (!userId || !userRole) {
      throw new BadRequestException('User authentication required');
    }

    const currentUser = await this.chatService.getUserById(userId);
    if (!currentUser) {
      throw new BadRequestException('Current user not found');
    }

    let practitionerId: string;
    let clientId: string;

    if (userRole === 'PRACTITIONER') {
      practitionerId = userId;
      clientId = participantId;
    } else if (userRole === 'CLIENT') {
      if (participantId === userId) {
        if (!currentUser.practitionerId) {
          throw new BadRequestException('Client is not assigned to any practitioner');
        }
        practitionerId = currentUser.practitionerId;
        clientId = userId;
      } else {
        practitionerId = participantId;
        clientId = userId;
      }
    } else {
      throw new BadRequestException('Invalid user role');
    }

    try {
      const conversation = await this.chatService.getOrCreateConversation(practitionerId, clientId);
      return { conversation };
    } catch (error) {
      throw new BadRequestException('Failed to create conversation: ' + (error as Error).message);
    }
  }

  @Get('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation details.' })
  async getConversation(@Param('conversationId') conversationId: string) {
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    try {
      const conversation = await this.chatService.getConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      return { conversation };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get conversation');
    }
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation messages.' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;

    try {
      const messages = await this.chatService.getConversationMessages(conversationId);

      const total = messages.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedMessages = messages.slice(startIndex, endIndex);

      return {
        messages: paginatedMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get messages:', error);
      throw new BadRequestException('Failed to get messages');
    }
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent.' })
  async sendMessage(@CurrentUser() user: RequestUser, @Body() sendMessageDto: SendMessageDto) {
    const { conversationId, content } = sendMessageDto;
    if (!conversationId || !content) {
      throw new BadRequestException('conversationId and content are required');
    }
    const userId = user.id;
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const message = await this.chatService.createMessage(conversationId, userId, content);
      this.chatGateway.sendMessageToConversation(conversationId, message);
      return { message };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to send message: ' + (error as Error).message);
    }
  }

  @Post('messages/:messageId/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read.' })
  async markMessagesAsRead(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string) {
    const userId = user.id;

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }
    try {
      await this.chatService.markMessagesAsRead(conversationId, userId);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to mark messages as read:', error);
      throw new BadRequestException('Failed to mark messages as read');
    }
  }

  @Post('messages/:messageId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiResponse({ status: 201, description: 'Reaction added.' })
  async addReaction(
    @CurrentUser() user: RequestUser,
    @Param('messageId') messageId: string,
    @Body() addReactionDto: AddReactionDto
  ) {
    const { emoji } = addReactionDto;
    const userId = user.id;

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    if (!messageId || !emoji) {
      throw new BadRequestException('messageId and emoji are required');
    }

    try {
      const reaction = await this.chatService.addReactionToMessage(messageId, userId, emoji);
      this.chatGateway.sendReactionToConversation(reaction.message.conversationId, reaction);
      return { reaction };
    } catch (error) {
      this.logger.error('Failed to add reaction:', error);
      throw new BadRequestException('Failed to add reaction');
    }
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiResponse({ status: 200, description: 'Reaction removed.' })
  async removeReaction(
    @CurrentUser() user: RequestUser,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    const userId = user.id;
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    if (!messageId || !emoji) {
      throw new BadRequestException('messageId and emoji are required');
    }

    try {
      await this.chatService.removeReactionFromMessage(messageId, userId, emoji);
      const message = await this.chatService.getMessageById(messageId);
      if (message) {
        this.chatGateway.removeReactionFromConversation(message.conversationId, { messageId, userId, emoji });
      }
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to remove reaction:', error);
      throw new BadRequestException('Failed to remove reaction');
    }
  }
}
