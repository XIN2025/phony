'use client';

import React from 'react';
import { Button } from '@repo/ui/components/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MessageReaction {
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

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onReactionClick: (emoji: string, hasReacted: boolean) => void;
  className?: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions = [],
  currentUserId,
  onReactionClick,
  className,
}) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!reaction?.emoji) return acc; // Safety check
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji]!.push(reaction);
      return acc;
    },
    {} as Record<string, MessageReaction[]>,
  );

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', className)}>
      <AnimatePresence>
        {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
          const hasUserReacted = reactionList.some((r) => r.userId === currentUserId);
          const count = reactionList.length;

          return (
            <motion.div
              key={emoji}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onReactionClick(emoji, hasUserReacted)}
                className={cn(
                  'h-6 px-2 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105',
                  hasUserReacted
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    : 'bg-muted/50 border-border/30 hover:bg-muted/80',
                )}
                title={`${reactionList.map((r) => r.user?.firstName || 'Someone').join(', ')} reacted with ${emoji}`}
              >
                <span className='mr-1'>{emoji}</span>
                <span>{count}</span>
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Quick reaction buttons component
interface QuickReactionsProps {
  onReactionClick: (emoji: string) => void;
  className?: string;
  onClose?: () => void; // New prop to handle manual closing
  showCloseButton?: boolean; // Option to show close button
}

export const QuickReactions: React.FC<QuickReactionsProps> = ({
  onReactionClick,
  className,
  onClose,
  showCloseButton = false,
}) => {
  const quickEmojis = ['👍', '❤️', '😊', '😮', '😢', '😡'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn('bg-background border rounded-lg shadow-lg max-w-[250px] sm:max-w-none', className)}
    >
      {/* Header with close button if needed */}
      {showCloseButton && onClose && (
        <div className='flex justify-end p-1 border-b'>
          <Button variant='ghost' size='sm' onClick={onClose} className='h-6 w-6 p-0 hover:bg-muted'>
            <X className='h-3 w-3' />
          </Button>
        </div>
      )}

      {/* Emoji buttons */}
      <div className='flex flex-wrap gap-1 p-2'>
        {quickEmojis.map((emoji) => (
          <Button
            key={emoji}
            variant='ghost'
            size='sm'
            onClick={() => onReactionClick(emoji)}
            className='h-8 w-8 p-0 hover:bg-muted hover:scale-110 transition-all duration-200 text-lg'
          >
            {emoji}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
