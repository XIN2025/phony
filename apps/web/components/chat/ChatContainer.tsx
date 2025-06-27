'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Send, Search, MessageCircle, Loader2, ArrowLeft, Menu, X } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useCreateOrGetConversation,
  useMarkMessagesAsRead,
} from '@/lib/hooks/use-api';
import { useSocket } from '@/lib/hooks/use-socket';
import { useUserPresence } from '@/lib/hooks/use-user-presence';
import { Conversation, Message } from '@repo/shared-types/types';

interface ChatContainerProps {
  participantId?: string;
  className?: string;
  height?: string;
}

interface SidebarContentProps {
  participantId?: string;
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearSearch: (e: React.MouseEvent) => void;
  setShowSidebar: (show: boolean) => void;
  isLoadingConversations: boolean;
  filteredConversations: Conversation[];
  selectedConversation: string | null;
  handleConversationSelect: (id: string) => void;
  currentUserId: string | undefined;
  getConversationDisplayName: (conversation: Conversation) => string;
  getConversationAvatar: (conversation: Conversation) => string | undefined;
  getConversationUser: (conversation: Conversation) => any;
  getLastMessagePreview: (conversation: Conversation) => string;
  getParticipantUserId: (conversation: Conversation) => string | null;
  getOnlineStatusColor: (userId: string | null) => string;
  refetchConversations: () => void;
}

const SidebarContent = React.memo<SidebarContentProps>(
  ({
    participantId,
    searchTerm,
    handleSearchChange,
    handleClearSearch,
    setShowSidebar,
    isLoadingConversations,
    filteredConversations,
    selectedConversation,
    handleConversationSelect,
    currentUserId,
    getConversationDisplayName,
    getConversationAvatar,
    getConversationUser,
    getLastMessagePreview,
    getParticipantUserId,
    getOnlineStatusColor,
    refetchConversations,
  }) => (
    <div className='flex flex-col h-full w-full bg-background border-r border-border/60'>
      <div className='p-3 sm:p-4 border-b border-border/60 bg-muted/5 flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Messages</h3>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='icon' onClick={() => refetchConversations()} title='Refresh conversations'>
              <Loader2 className='h-4 w-4' />
            </Button>
            {!participantId && (
              <Button variant='ghost' size='icon' className='md:hidden' onClick={() => setShowSidebar(false)}>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className='p-2 sm:p-3 border-b border-border/60 flex-shrink-0'>
        <div className='relative flex items-center'>
          <Search className='absolute left-2 sm:left-3 h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground pointer-events-none' />
          <Input
            placeholder='Search conversations...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-10 bg-background border border-border focus:bg-background focus:border-primary transition-colors rounded-md text-xs sm:text-sm flex items-center'
            autoComplete='off'
          />
          {searchTerm && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-1 sm:right-2 h-5 sm:h-6 w-5 sm:w-6 hover:bg-muted rounded-full p-0'
              onClick={handleClearSearch}
              type='button'
            >
              <X className='h-2.5 sm:h-3 w-2.5 sm:w-3' />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className='flex-1 min-h-0'>
        {isLoadingConversations ? (
          <div className='p-2 sm:p-3 space-y-2 sm:space-y-3'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg'>
                <div className='w-10 sm:w-12 h-10 sm:h-12 bg-muted rounded-full animate-pulse' />
                <div className='flex-1 space-y-1 sm:space-y-2'>
                  <div className='h-3 sm:h-4 bg-muted rounded animate-pulse' />
                  <div className='h-2 sm:h-3 bg-muted rounded w-3/4 animate-pulse' />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className='p-4 sm:p-6 text-center text-muted-foreground'>
            <MessageCircle className='h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-2 opacity-50' />
            <p className='text-xs sm:text-sm'>{searchTerm ? 'No conversations found' : 'No conversations yet'}</p>
          </div>
        ) : (
          <div className='p-1 sm:p-2'>
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversation === conversation.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start h-auto p-2 sm:p-3 mb-1 rounded-lg transition-all duration-200',
                  selectedConversation === conversation.id
                    ? 'bg-primary/10 border border-primary/30 shadow-sm ring-1 ring-primary/20'
                    : 'hover:bg-muted/80 border border-transparent',
                )}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                <div className='flex items-center space-x-2 sm:space-x-3 w-full'>
                  <div className='relative'>
                    <Avatar className='h-10 sm:h-12 w-10 sm:w-12 border-2 border-background shadow-sm'>
                      <AvatarImage
                        src={getAvatarUrl(getConversationAvatar(conversation), getConversationUser(conversation))}
                        alt={getConversationDisplayName(conversation)}
                      />
                      <AvatarFallback className='text-xs sm:text-sm font-medium bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'>
                        {getInitials(getConversationDisplayName(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    {/* Real online status indicator */}
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full border-2 border-background',
                        getOnlineStatusColor(getParticipantUserId(conversation)),
                      )}
                    />
                  </div>
                  <div className='flex-1 text-left min-w-0'>
                    <div className='font-medium truncate text-xs sm:text-sm'>
                      {getConversationDisplayName(conversation)}
                    </div>
                    <div className='text-xs text-muted-foreground truncate mt-0.5 sm:mt-1'>
                      {getLastMessagePreview(conversation)}
                    </div>
                  </div>
                  {/* Unread indicator */}
                  {conversation.messages &&
                    conversation.messages.length > 0 &&
                    conversation.messages[0]?.authorId !== currentUserId &&
                    !conversation.messages[0]?.readAt && (
                      <div className='w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary rounded-full flex-shrink-0' />
                    )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  ),
);

export function ChatContainer({ participantId, className, height = 'calc(100vh - 12rem)' }: ChatContainerProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasTriedCreatingConversation, setHasTriedCreatingConversation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastMarkedConversation = useRef<string | null>(null);

  const currentUserId = session?.user?.id;

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetConversations();
  const conversations = conversationsData?.conversations || [];
  const { data: messagesData, isLoading: isLoadingMessages } = useGetMessages(selectedConversation || '', 1, 50);
  const messages = messagesData?.messages || [];
  const { mutate: sendMessage, isPending: isSendingMessage } = useSendMessage();
  const { mutate: createOrGetConversation, isPending: isCreatingConversation } = useCreateOrGetConversation();
  const { mutate: markAsRead } = useMarkMessagesAsRead();
  const { getUserStatus, isUserOnline, requestUserStatus, requestOnlineUsers } = useUserPresence();

  // Memoize search handler to prevent re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchTerm('');
  }, []);

  // Memoize utility functions to prevent re-renders
  const getConversationDisplayName = useCallback(
    (conversation: Conversation) => {
      if (!conversation) return 'Unknown';

      if (session?.user?.role === 'CLIENT') {
        return conversation.practitioner
          ? `${conversation.practitioner.firstName || ''} ${conversation.practitioner.lastName || ''}`.trim() ||
              'Practitioner'
          : 'Practitioner';
      } else {
        return conversation.client
          ? `${conversation.client.firstName || ''} ${conversation.client.lastName || ''}`.trim() || 'Client'
          : 'Client';
      }
    },
    [session?.user?.role],
  );

  const getConversationAvatar = useCallback(
    (conversation: Conversation) => {
      if (session?.user?.role === 'CLIENT') {
        return conversation.practitioner?.avatarUrl || undefined;
      } else {
        return conversation.client?.avatarUrl || undefined;
      }
    },
    [session?.user?.role],
  );

  const getConversationUser = useCallback(
    (conversation: Conversation) => {
      if (session?.user?.role === 'CLIENT') {
        return conversation.practitioner;
      } else {
        return conversation.client;
      }
    },
    [session?.user?.role],
  );

  const getLastMessagePreview = useCallback(
    (conversation: Conversation) => {
      if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        return 'No messages yet';
      }

      const lastMessage = conversation.messages[0];
      if (!lastMessage || !lastMessage.content) return 'No messages yet';

      const maxLength = 35;
      let preview = String(lastMessage.content);

      if (preview.length > maxLength) {
        preview = preview.substring(0, maxLength) + '...';
      }

      const isOwnMessage = lastMessage.authorId === currentUserId;
      return isOwnMessage ? `You: ${preview}` : preview;
    },
    [currentUserId],
  );

  const getParticipantUserId = useCallback(
    (conversation: Conversation) => {
      if (!conversation) return null;

      if (session?.user?.role === 'CLIENT') {
        return conversation.practitionerId || null;
      } else {
        return conversation.clientId || null;
      }
    },
    [session?.user?.role],
  );

  const getParticipantUserIdFromSelectedConversation = useCallback(() => {
    if (!selectedConversation) return null;
    const conversation = conversations.find((c) => c.id === selectedConversation);
    return conversation ? getParticipantUserId(conversation) : null;
  }, [selectedConversation, conversations, getParticipantUserId]);

  const getOnlineStatusText = useCallback(
    (userId: string | null) => {
      if (!userId) return 'Offline';
      const status = getUserStatus(userId);

      switch (status) {
        case 'online':
          return 'Online';
        case 'offline':
          return 'Offline';
        case 'unknown':
        default:
          return 'Offline';
      }
    },
    [getUserStatus],
  );

  const getOnlineStatusColor = useCallback(
    (userId: string | null) => {
      if (!userId) return 'bg-gray-400';
      const status = getUserStatus(userId);

      switch (status) {
        case 'online':
          return 'bg-green-500';
        case 'offline':
          return 'bg-gray-400';
        case 'unknown':
        default:
          return 'bg-gray-400';
      }
    },
    [getUserStatus],
  );

  const socket = useSocket('newMessage', (...args: unknown[]) => {
    const message = args[0] as Message;

    // Directly update the messages cache instead of invalidating
    const cacheKey = ['messages', message.conversationId, 1, 50];
    queryClient.setQueryData(cacheKey, (old: any) => {
      if (!old) {
        // If no data exists, create initial structure with the new message
        return {
          messages: [message],
          pagination: {
            page: 1,
            limit: 50,
            total: 1,
            totalPages: 1,
          },
        };
      }

      // Remove any existing message with the same ID to prevent duplicates
      const filteredMessages = old.messages.filter((msg: Message) => msg.id !== message.id);

      // Add the new message at the end (messages are in ascending order)
      return {
        ...old,
        messages: [...filteredMessages, message],
        pagination: {
          ...old.pagination,
          total: Math.max(old.pagination.total, filteredMessages.length + 1),
        },
      };
    });

    // Only invalidate conversations to update last message preview
    queryClient.invalidateQueries({ queryKey: ['conversations'] });

    // Scroll to bottom when new message arrives in the current conversation
    if (message.conversationId === selectedConversation) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    if (
      message.conversationId === selectedConversation &&
      message.authorId !== currentUserId &&
      message.conversationId !== lastMarkedConversation.current
    ) {
      lastMarkedConversation.current = message.conversationId;
      markAsRead(message.conversationId);
    }
  });

  // Listen for reaction events
  useSocket('reactionAdded', (data: any) => {
    const { messageId, reaction } = data;

    // Update ALL message queries, not just the specific page
    queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
      if (!old) return old;

      return {
        ...old,
        messages: old.messages.map((msg: Message) => {
          if (msg.id === messageId) {
            const existingReactions = msg.reactions || [];
            // Check if this reaction already exists to prevent duplicates
            const reactionExists = existingReactions.some(
              (r: any) => r.userId === reaction.userId && r.emoji === reaction.emoji,
            );

            if (!reactionExists) {
              return {
                ...msg,
                reactions: [...existingReactions, reaction],
              };
            }
          }
          return msg;
        }),
      };
    });
  });

  useSocket('reactionRemoved', (data: any) => {
    const { messageId, userId, emoji } = data;

    // Update ALL message queries, not just the specific page
    queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
      if (!old) return old;

      return {
        ...old,
        messages: old.messages.map((msg: Message) => {
          if (msg.id === messageId) {
            const filteredReactions = (msg.reactions || []).filter(
              (reaction) => !(reaction.emoji === emoji && reaction.userId === userId),
            );
            return {
              ...msg,
              reactions: filteredReactions,
            };
          }
          return msg;
        }),
      };
    });
  });

  // Check socket connection status
  const isSocketConnected = socket?.connected || false;

  // Trigger presence updates when socket connects
  useEffect(() => {
    if (socket?.connected) {
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        requestOnlineUsers();
        // Also request status for all conversation participants immediately
        conversations.forEach((conversation) => {
          const participantId = getParticipantUserId(conversation);
          if (participantId) {
            requestUserStatus(participantId);
          }
        });
      }, 1000);
    }
  }, [socket?.connected, requestOnlineUsers, conversations, getParticipantUserId, requestUserStatus]);

  // Join conversation room when conversation is selected
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('joinConversation', { conversationId: selectedConversation });

      return () => {
        socket.emit('leaveConversation', { conversationId: selectedConversation });
      };
    }
  }, [socket, selectedConversation]);

  // Request presence status when conversations load
  useEffect(() => {
    if (socket?.connected && conversations.length > 0) {
      // Request online users list when conversations are loaded
      requestOnlineUsers();

      // Request status for all conversation participants
      conversations.forEach((conversation) => {
        const participantId = getParticipantUserId(conversation);
        if (participantId) {
          requestUserStatus(participantId);
        }
      });
    }
  }, [socket?.connected, conversations, requestOnlineUsers, requestUserStatus, getParticipantUserId]);

  // Force presence refresh when user returns to chat page
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (socket?.connected && conversations.length > 0) {
      // Multiple requests to ensure we get fresh data when returning
      const refreshPresence = () => {
        requestOnlineUsers();
        conversations.forEach((conversation) => {
          const participantId = getParticipantUserId(conversation);
          if (participantId) {
            requestUserStatus(participantId);
          }
        });
      };

      // Immediate refresh
      refreshPresence();

      // Additional refresh after a short delay
      setTimeout(refreshPresence, 2000);
    }
  }, [socket?.connected, conversations.length]); // Trigger when socket connects or conversations change

  // Scroll to bottom when messages load or conversation changes
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages.length, selectedConversation, isLoadingMessages]);

  // Enhanced search functionality - memoized to prevent re-renders
  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase().trim();

      try {
        const displayName = getConversationDisplayName(conversation);
        const lastMessage = getLastMessagePreview(conversation);

        // Search in conversation name, last message content, and participant details
        const searchableText = [
          displayName || '',
          lastMessage || '',
          conversation.practitioner
            ? `${conversation.practitioner.firstName || ''} ${conversation.practitioner.lastName || ''}`.trim()
            : '',
          conversation.client
            ? `${conversation.client.firstName || ''} ${conversation.client.lastName || ''}`.trim()
            : '',
          conversation.practitioner?.profession || '',
          conversation.client?.email || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      } catch (error) {
        // Handle search filter error silently in production
        return true; // Show conversation if search fails
      }
    });
  }, [conversations, searchTerm, getConversationDisplayName, getLastMessagePreview]);

  // Close sidebar when conversation is selected on mobile
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowSidebar(false);
  }, []);

  useEffect(() => {
    if (participantId && !selectedConversation && !isCreatingConversation) {
      const existingConversation = conversations.find(
        (conv) => conv.practitionerId === participantId || conv.clientId === participantId,
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
      } else if (!isLoadingConversations) {
        createOrGetConversation(participantId, {
          onSuccess: (data) => {
            setSelectedConversation(data.conversation.id);
          },
          onError: (error) => {
            toast.error('Failed to create conversation: ' + error.message);
          },
        });
      }
    }
  }, [
    participantId,
    conversations,
    selectedConversation,
    isCreatingConversation,
    isLoadingConversations,
    createOrGetConversation,
  ]);

  useEffect(() => {
    if (
      !participantId &&
      !isLoadingConversations &&
      conversations.length === 0 &&
      session?.user?.role === 'CLIENT' &&
      session?.user?.practitionerId &&
      !isCreatingConversation &&
      !hasTriedCreatingConversation
    ) {
      setHasTriedCreatingConversation(true);
      createOrGetConversation(session.user.practitionerId, {
        onSuccess: (data) => {
          setSelectedConversation(data.conversation.id);
        },
        onError: (error) => {
          toast.error('Failed to connect to your practitioner: ' + error.message);
        },
      });
    }
  }, [
    participantId,
    isLoadingConversations,
    conversations.length,
    session?.user?.role,
    session?.user?.practitionerId,
    isCreatingConversation,
    hasTriedCreatingConversation,
    createOrGetConversation,
  ]);

  useEffect(() => {
    if (!participantId && !selectedConversation && conversations.length > 0 && conversations[0]) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, participantId]);

  useEffect(() => {
    if (selectedConversation && selectedConversation !== lastMarkedConversation.current) {
      lastMarkedConversation.current = selectedConversation;
      const markReadTimer = setTimeout(() => {
        markAsRead(selectedConversation);
      }, 500);

      return () => clearTimeout(markReadTimer);
    }
  }, [selectedConversation, markAsRead]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Request user status for all conversation participants
  useEffect(() => {
    if (socket?.connected) {
      conversations.forEach((conversation) => {
        const participantId = getParticipantUserId(conversation);
        if (participantId) {
          requestUserStatus(participantId);
        }
      });
    }
  }, [conversations, socket?.connected, getParticipantUserId, requestUserStatus]);

  // Request status for selected conversation participant
  useEffect(() => {
    if (socket?.connected && selectedConversation) {
      const conversation = conversations.find((c) => c.id === selectedConversation);
      if (conversation) {
        const participantId = getParticipantUserId(conversation);
        if (participantId) {
          requestUserStatus(participantId);
        }
      }
    }
  }, [selectedConversation, conversations, socket?.connected, getParticipantUserId, requestUserStatus]);

  // Periodic status refresh
  useEffect(() => {
    if (!socket?.connected) return;

    const interval = setInterval(() => {
      // Request online users list periodically
      requestOnlineUsers();

      // Request individual status for conversation participants
      conversations.forEach((conversation) => {
        const participantId = getParticipantUserId(conversation);
        if (participantId) {
          requestUserStatus(participantId);
        }
      });
    }, 15000); // Refresh every 15 seconds (more frequent)

    return () => clearInterval(interval);
  }, [socket?.connected, conversations, getParticipantUserId, requestUserStatus, requestOnlineUsers]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || isSendingMessage) return;

    const messageContent = messageText.trim();

    // Clear input immediately for instant feedback
    setMessageText('');

    sendMessage(
      {
        conversationId: selectedConversation,
        content: messageContent,
        authorId: currentUserId,
        currentUser: session?.user,
      },
      {
        onSuccess: () => {
          messageInputRef.current?.focus();
          // Scroll to bottom after sending message
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        },
        onError: (error) => {
          // Restore message text on error
          setMessageText(messageContent);
          toast.error('Failed to send message: ' + error.message);
        },
      },
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    messageInputRef.current?.focus();
  };

  if (!session?.user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (session?.user?.role === 'CLIENT' && !session?.user?.practitionerId) {
    return (
      <div className='flex items-center justify-center h-64 text-center'>
        <div className='space-y-2'>
          <MessageCircle className='h-12 w-12 mx-auto text-muted-foreground' />
          <p className='text-muted-foreground'>No practitioner assigned yet</p>
          <p className='text-sm text-muted-foreground'>You'll be able to message once you're assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex bg-background border border-gray-700 rounded-lg shadow-sm overflow-hidden w-full h-full',
        className,
      )}
    >
      <div className={cn('flex w-full h-full overflow-hidden', participantId ? 'flex-col' : 'flex-row')}>
        {/* Sidebar - Always visible on desktop, collapsible on mobile */}
        {!participantId && (
          <>
            {/* Desktop Sidebar */}
            <div className='hidden md:flex w-72 lg:w-80 xl:w-96 flex-shrink-0' style={{ height }}>
              <SidebarContent
                participantId={participantId}
                searchTerm={searchTerm}
                handleSearchChange={handleSearchChange}
                handleClearSearch={handleClearSearch}
                setShowSidebar={setShowSidebar}
                isLoadingConversations={isLoadingConversations}
                filteredConversations={filteredConversations}
                selectedConversation={selectedConversation}
                handleConversationSelect={handleConversationSelect}
                currentUserId={currentUserId}
                getConversationDisplayName={getConversationDisplayName}
                getConversationAvatar={getConversationAvatar}
                getConversationUser={getConversationUser}
                getLastMessagePreview={getLastMessagePreview}
                getParticipantUserId={getParticipantUserId}
                getOnlineStatusColor={getOnlineStatusColor}
                refetchConversations={refetchConversations}
              />
            </div>

            {/* Mobile Sidebar */}
            {showSidebar && (
              <div className='fixed inset-0 z-50 md:hidden'>
                <div className='absolute inset-0 bg-black/50' onClick={() => setShowSidebar(false)} />
                <div className='absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background'>
                  <SidebarContent
                    participantId={participantId}
                    searchTerm={searchTerm}
                    handleSearchChange={handleSearchChange}
                    handleClearSearch={handleClearSearch}
                    setShowSidebar={setShowSidebar}
                    isLoadingConversations={isLoadingConversations}
                    filteredConversations={filteredConversations}
                    selectedConversation={selectedConversation}
                    handleConversationSelect={handleConversationSelect}
                    currentUserId={currentUserId}
                    getConversationDisplayName={getConversationDisplayName}
                    getConversationAvatar={getConversationAvatar}
                    getConversationUser={getConversationUser}
                    getLastMessagePreview={getLastMessagePreview}
                    getParticipantUserId={getParticipantUserId}
                    getOnlineStatusColor={getOnlineStatusColor}
                    refetchConversations={refetchConversations}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Chat Area */}
        <div className='flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden'>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className='p-3 sm:p-4 border-b border-border/60 bg-muted/5 backdrop-blur-sm flex-shrink-0'>
                <div className='flex items-center space-x-3'>
                  {!participantId && (
                    <Button variant='ghost' size='icon' className='md:hidden' onClick={() => setShowSidebar(true)}>
                      <Menu className='h-4 w-4' />
                    </Button>
                  )}

                  {(() => {
                    const conversation = conversations.find((c) => c.id === selectedConversation);
                    if (!conversation) return null;

                    return (
                      <>
                        <div className='relative'>
                          <Avatar className='h-10 w-10 border-2 border-background shadow-sm'>
                            <AvatarImage
                              src={getAvatarUrl(getConversationAvatar(conversation))}
                              alt={getConversationDisplayName(conversation)}
                            />
                            <AvatarFallback className='text-sm font-medium bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'>
                              {getInitials(getConversationDisplayName(conversation))}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                              getOnlineStatusColor(getParticipantUserId(conversation)),
                            )}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium truncate'>{getConversationDisplayName(conversation)}</div>
                          <div className='text-sm text-muted-foreground flex items-center gap-2'>
                            <span>
                              {session?.user?.role === 'CLIENT' ? 'Practitioner' : 'Client'} •{' '}
                              {getOnlineStatusText(getParticipantUserId(conversation))}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages Area */}
              <div className='flex-1 min-h-0 overflow-hidden'>
                <ScrollArea className='h-full'>
                  <div className='p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 min-h-full'>
                    {isLoadingMessages ? (
                      <div className='space-y-4'>
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={cn('flex animate-pulse', i % 2 === 0 ? 'justify-end' : 'justify-start')}
                          >
                            <div className='max-w-xs space-y-2'>
                              <div className='h-12 bg-muted rounded-lg' />
                              <div className='h-3 bg-muted rounded w-16' />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className='text-center text-muted-foreground py-12'>
                        <MessageCircle className='h-16 w-16 mx-auto mb-4 text-muted-foreground/50' />
                        <p className='text-lg font-medium mb-2'>No messages yet</p>
                        <p className='text-sm'>Start the conversation by sending a message!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const prevMessage = index > 0 ? messages[index - 1] : null;
                          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                          // Message grouping logic
                          const isGroupStart =
                            !prevMessage ||
                            prevMessage.authorId !== message.authorId ||
                            new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() >
                              5 * 60 * 1000; // 5 minutes

                          const isGroupEnd =
                            !nextMessage ||
                            nextMessage.authorId !== message.authorId ||
                            new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() >
                              5 * 60 * 1000; // 5 minutes

                          const showAvatar = isGroupEnd; // Only show avatar on the last message of a group
                          const isGrouped = !isGroupStart; // Grouped if not the start of a group

                          const isOwn = message.authorId === currentUserId;

                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={isOwn}
                              showAvatar={showAvatar}
                              isGrouped={isGrouped}
                            />
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className='p-2 sm:p-3 md:p-4 lg:p-6 border-t border-border/60 bg-muted/5 backdrop-blur-sm flex-shrink-0'>
                <form onSubmit={handleSendMessage} className='flex items-center space-x-2 sm:space-x-3'>
                  <div className='flex-1 flex items-center space-x-2 bg-background rounded-xl border border-muted-foreground/20 h-10 sm:h-11 md:h-12 px-3'>
                    <Input
                      ref={messageInputRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder='Type a message...'
                      disabled={isSendingMessage}
                      className='flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 text-sm md:text-base h-full'
                      autoComplete='off'
                    />
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} className='flex-shrink-0' />
                  </div>
                  <Button
                    type='submit'
                    disabled={!messageText.trim() || isSendingMessage}
                    size='icon'
                    className='h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full shrink-0'
                  >
                    {isSendingMessage ? (
                      <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 animate-spin' />
                    ) : (
                      <Send className='h-4 w-4 sm:h-5 sm:w-5' />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center space-y-4 max-w-md mx-auto px-4'>
                {!participantId && (
                  <Button variant='outline' className='md:hidden mb-4' onClick={() => setShowSidebar(true)}>
                    <Menu className='h-4 w-4 mr-2' />
                    View Conversations
                  </Button>
                )}
                <MessageCircle className='h-16 w-16 text-muted-foreground/50 mx-auto' />
                <div>
                  <p className='text-lg font-medium text-muted-foreground mb-2'>
                    {participantId ? 'Loading conversation...' : 'Select a conversation'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {participantId
                      ? 'Please wait while we set up your chat'
                      : conversations.length === 0
                        ? 'No conversations yet. Start by contacting a client or practitioner.'
                        : 'Choose a conversation from the sidebar to start messaging'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
