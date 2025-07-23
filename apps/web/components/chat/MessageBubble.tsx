'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Check, CheckCheck, Clock, Link, Download, ExternalLink } from 'lucide-react';
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

  const handleAttachmentClick = (attachment: any) => {
    if (attachment.type === 'LINK') {
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
    } else {
      // For files and images, download or open in new tab
      const fullUrl = attachment.url.startsWith('http')
        ? attachment.url
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${attachment.url}`;

      if (attachment.type === 'IMAGE') {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Download file
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = attachment.fileName || attachment.title || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group w-full px-3 sm:px-4 lg:px-6 mb-2 sm:mb-3 max-w-full', isGrouped && 'mt-0 mb-1 sm:mb-2')}
    >
      <div
        className={cn(
          'flex gap-2 sm:gap-3 lg:gap-4 w-full min-w-0',
          isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row',
        )}
        style={{
          marginLeft: isOwn ? 'auto' : '0',
          marginRight: isOwn ? '0' : 'auto',
        }}
      >
        {!isOwn &&
          (showAvatar && !isGrouped ? (
            <Avatar className='h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mt-1 ring-2 ring-background shadow-sm flex-shrink-0' />
          ) : (
            <div className='w-6 sm:w-7 lg:w-8 flex-shrink-0' />
          ))}

        <div className={cn('flex flex-col gap-1 sm:gap-2 min-w-0', isOwn ? 'items-end' : 'items-start')}>
          <div className='relative min-w-0'>
            <div
              className={cn(
                'relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl break-words transition-all duration-200 hover:shadow-md',
                'inline-block max-w-[90vw] sm:max-w-[60vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[35vw]',
                'text-sm sm:text-base leading-relaxed',
                isOwn
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-foreground border border-border',
              )}
            >
              <p className='whitespace-pre-wrap break-words'>{message.content}</p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className='mt-3 space-y-2'>
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={attachment.id || index}
                      className='flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/30 hover:bg-background/70 transition-colors cursor-pointer'
                      onClick={() => handleAttachmentClick(attachment)}
                    >
                      {attachment.type === 'LINK' ? (
                        <Link className='w-5 h-5 text-blue-500 flex-shrink-0' />
                      ) : attachment.type === 'IMAGE' ? (
                        <span role='img' aria-label='Image' className='text-green-500 text-lg'>
                          🖼️
                        </span>
                      ) : (
                        <span role='img' aria-label='File' className='text-purple-500 text-lg'>
                          📄
                        </span>
                      )}

                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-sm truncate'>
                          {attachment.title || attachment.fileName || 'Attachment'}
                        </div>
                        {attachment.type === 'LINK' && (
                          <div className='text-xs text-muted-foreground truncate'>{attachment.url}</div>
                        )}
                        {attachment.fileSize && (
                          <div className='text-xs text-muted-foreground'>
                            {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                          </div>
                        )}
                      </div>

                      {attachment.type === 'LINK' ? (
                        <ExternalLink className='w-4 h-4 text-muted-foreground' />
                      ) : (
                        <Download className='w-4 h-4 text-muted-foreground' />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Clean message tail */}
              {/* Removed the tail triangle for both own and other messages */}
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
            <Avatar className='h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mt-1 ring-2 ring-background shadow-sm flex-shrink-0' />
          ) : (
            <div className='w-6 sm:w-7 lg:w-8 flex-shrink-0' />
          ))}
      </div>
    </motion.div>
  );
};
