'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { cn, getInitials, getAvatarUrl } from '@/lib/utils';
import { Message } from '@repo/shared-types';
import { MessageReactions } from './MessageReactions';
import { MessageActions } from './MessageActions';
import { useSession } from 'next-auth/react';
import { useAddReaction, useRemoveReaction } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  isGrouped = false,
}) => {
  const { data: session } = useSession();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const messageAuthor = message.author;

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    if (message.readAt) {
      return <CheckCheck className='h-3 w-3 text-blue-500' />;
    }
    return <Clock className='h-3 w-3 text-gray-400' />;
  };

  const handleReactionClick = (emoji: string, hasReacted: boolean) => {
    if (hasReacted) {
      // Find the reaction to remove
      const reactionToRemove = message.reactions?.find((r) => r.emoji === emoji && r.userId === session?.user?.id);
      if (reactionToRemove) {
        removeReaction.mutate({
          messageId: message.id,
          reactionId: reactionToRemove.id,
        });
      }
    } else {
      addReaction.mutate({
        messageId: message.id,
        emoji,
        currentUserId: session?.user?.id,
      });
    }
  };

  const handleReactionAdd = (emoji: string) => {
    addReaction.mutate({
      messageId: message.id,
      emoji,
      currentUserId: session?.user?.id,
    });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group w-full px-3 sm:px-4 lg:px-6 mb-2 sm:mb-3', isGrouped && 'mt-0 mb-1 sm:mb-2')}
    >
      <div
        className={cn('flex gap-2 sm:gap-3 lg:gap-4 w-full', isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row')}
        style={{
          marginLeft: isOwn ? 'auto' : '0',
          marginRight: isOwn ? '0' : 'auto',
        }}
      >
        {!isOwn &&
          (showAvatar && !isGrouped ? (
            <Avatar className='h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mt-1 ring-2 ring-background shadow-sm flex-shrink-0'>
              <AvatarImage src={getAvatarUrl(messageAuthor?.avatarUrl)} />
              <AvatarFallback className='text-xs font-medium bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'>
                {getInitials(messageAuthor || {})}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className='w-6 sm:w-7 lg:w-8 flex-shrink-0' />
          ))}

        <div className={cn('flex flex-col gap-1 sm:gap-2', isOwn ? 'items-end' : 'items-start')}>
          <div className='relative'>
            <div
              className={cn(
                'relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl break-words transition-all duration-200 hover:shadow-md',
                'inline-block max-w-[70vw] sm:max-w-[60vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[35vw]',
                'text-sm sm:text-base leading-relaxed',
                isOwn
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-foreground border border-border',
              )}
            >
              <p className='whitespace-pre-wrap break-words'>{message.content}</p>

              {/* Clean message tail */}
              <div
                className={cn(
                  'absolute w-0 h-0',
                  isOwn
                    ? 'bottom-0 -right-1 border-l-[8px] border-t-[8px] border-l-primary border-t-transparent'
                    : 'bottom-0 -left-1 border-r-[8px] border-t-[8px] border-r-muted border-t-transparent',
                )}
              />
            </div>

            {/* Fixed Message Actions positioning to avoid avatar overlap */}
            <div
              className={cn(
                'absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'top-0',
                isOwn ? '-left-16 sm:-left-20 md:-left-24' : '-right-16 sm:-right-20 md:-right-24',
              )}
            >
              <MessageActions
                messageId={message.id}
                isOwn={isOwn}
                onReactionAdd={handleReactionAdd}
                onCopyMessage={handleCopyMessage}
                onReplyMessage={() => {}}
                onEditMessage={() => {}}
                onDeleteMessage={() => {}}
              />
            </div>
          </div>

          {/* Message Reactions */}
          <MessageReactions
            reactions={message.reactions || []}
            currentUserId={session?.user?.id || ''}
            onReactionClick={handleReactionClick}
          />

          {/* Compact message metadata for grouped messages */}
          {isGrouped && (
            <div className={cn('text-xs text-muted-foreground px-2', isOwn ? 'text-right' : 'text-left')}>
              {formatTime(message.createdAt)}
            </div>
          )}
        </div>

        {isOwn &&
          (showAvatar && !isGrouped ? (
            <Avatar className='h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mt-1 ring-2 ring-background shadow-sm flex-shrink-0'>
              <AvatarImage src={getAvatarUrl(messageAuthor?.avatarUrl)} />
              <AvatarFallback className='text-xs font-medium bg-gradient-to-br from-green-100 to-blue-100 text-green-700'>
                {getInitials(messageAuthor || {})}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className='w-6 sm:w-7 lg:w-8 flex-shrink-0' />
          ))}
      </div>
    </motion.div>
  );
};
