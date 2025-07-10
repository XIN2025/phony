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
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';

interface AuthenticatedRequest {
  user?: {
    id: string;
    role: string;
  };
  headers: Record<string, string>;
}

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway
  ) {}

  // Get conversations for the authenticated user
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get conversations for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of conversations.' })
  async getConversations(@Request() req: AuthenticatedRequest) {
    try {
      const userId = req.user?.id || req.headers['x-user-id'];
      const userRole = req.user?.role;

      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      let role = userRole;
      if (!role) {
        const user = await this.chatService.getUserById(userId);
        role = user?.role;
      }

      if (!role) {
        throw new BadRequestException('User role not found');
      }

      if (role === 'PRACTITIONER') {
        const conversations = await this.chatService.getConversationsByPractitioner(userId);
        return { conversations };
      } else {
        const conversations = await this.chatService.getConversationsByClient(userId);
        return { conversations };
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get conversations');
    }
  }

  // Create or get conversation
  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or get a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation created or retrieved.' })
  async createOrGetConversation(@Request() req: AuthenticatedRequest, @Body() body: { participantId: string }) {
    if (!body.participantId) {
      throw new BadRequestException('participantId is required');
    }

    const userId = req.user?.id || req.headers['x-user-id'];
    let userRole = req.user?.role;

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    if (!userRole) {
      const user = await this.chatService.getUserById(userId);
      userRole = user?.role;
    }

    if (!userRole) {
      throw new BadRequestException('User role not found');
    }

    const { participantId } = body;
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

  // Get specific conversation
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

  // Get messages for a conversation
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

  // Send a message
  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent.' })
  async sendMessage(@Request() req: AuthenticatedRequest, @Body() body: { conversationId: string; content: string }) {
    if (!body.conversationId || !body.content) {
      throw new BadRequestException('conversationId and content are required');
    }

    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    const { conversationId, content } = body;

    try {
      const savedMessage = await this.chatService.sendMessage({
        conversationId,
        authorId: userId,
        content,
      });

      this.chatGateway.server.to(conversationId).emit('newMessage', savedMessage);
      return { message: savedMessage };
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      return {
        success: false,
        message: 'Failed to send message',
      };
    }
  }

  // Mark messages as read
  @Post('conversations/:conversationId/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read.' })
  async markMessagesAsRead(@Request() req: AuthenticatedRequest, @Param('conversationId') conversationId: string) {
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const result = await this.chatService.markMessagesAsRead(conversationId, userId);

      // Notify via WebSocket that messages were read
      this.chatGateway.server.to(conversationId).emit('messagesRead', {
        conversationId,
        userId,
        timestamp: new Date(),
      });

      return { success: true, updatedCount: result.count };
    } catch (error) {
      this.logger.error('Failed to mark messages as read:', error);
      throw new BadRequestException('Failed to mark messages as read');
    }
  }

  @Post('messages/:messageId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiResponse({ status: 201, description: 'Reaction added.' })
  async addReaction(
    @Request() req: AuthenticatedRequest,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string }
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    if (!body.emoji) {
      throw new BadRequestException('Emoji is required');
    }

    try {
      const reaction = await this.chatService.addReaction(messageId, userId, body.emoji);

      // Get message to find conversation for real-time update
      const message = await this.chatService.getMessageById(messageId);
      if (message) {
        this.chatGateway.server.to(message.conversationId).emit('reactionAdded', {
          messageId,
          reaction,
        });
      }

      return { reaction };
    } catch (error) {
      throw new BadRequestException('Failed to add reaction: ' + error.message);
    }
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiResponse({ status: 200, description: 'Reaction removed.' })
  async removeReaction(
    @Request() req: AuthenticatedRequest,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      const removed = await this.chatService.removeReaction(messageId, userId, emoji);

      // Get message to find conversation for real-time update
      if (removed) {
        const message = await this.chatService.getMessageById(messageId);
        if (message) {
          this.chatGateway.server.to(message.conversationId).emit('reactionRemoved', {
            messageId,
            userId,
            emoji,
          });
        }
      }

      return { success: removed };
    } catch (error) {
      throw new BadRequestException('Failed to remove reaction: ' + error.message);
    }
  }
}
