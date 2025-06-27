export interface Conversation {
  id: string;
  practitionerId: string;
  clientId: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  practitioner?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    profession?: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email?: string;
  };
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  readAt?: Date;
  createdAt: Date;
  reactions?: MessageReaction[];
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
  };
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface GetConversationResponse {
  conversation: Conversation;
}

export interface GetMessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AddReactionRequest {
  messageId: string;
  emoji: string;
}

export interface RemoveReactionRequest {
  messageId: string;
  emoji: string;
}
