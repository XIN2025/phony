'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { MoreHorizontal, Copy, Reply, Edit, Trash2, Smile } from 'lucide-react';
import { QuickReactions } from './MessageReactions';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  onReactionAdd: (emoji: string) => void;
  onCopyMessage?: () => void;
  onReplyMessage?: () => void;
  onEditMessage?: () => void;
  onDeleteMessage?: () => void;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  isOwn,
  onReactionAdd,
  onCopyMessage,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
  className,
}) => {
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const quickReactionsRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const moreActionsRef = useRef<HTMLDivElement>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickReactionsRef.current && !quickReactionsRef.current.contains(event.target as Node)) {
        setShowQuickReactions(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReactionAdd = (emoji: string) => {
    onReactionAdd(emoji);
    // Don't auto-close immediately - let users add multiple reactions
    // But set a timer to auto-close after 3 seconds of inactivity
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
    }

    autoCloseTimeoutRef.current = setTimeout(() => {
      setShowQuickReactions(false);
      setShowEmojiPicker(false);
    }, 3000); // Auto-close after 3 seconds
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn('flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity', className)}
    >
      {/* Mobile backdrop for overlays */}
      {(showQuickReactions || showMoreActions || showEmojiPicker) && (
        <div
          className='fixed inset-0 bg-black/20 z-40 md:hidden'
          onClick={() => {
            setShowQuickReactions(false);
            setShowMoreActions(false);
            setShowEmojiPicker(false);
          }}
        />
      )}

      {/* Quick Reaction Button */}
      <div className='relative'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowQuickReactions(!showQuickReactions)}
          className='h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/80 rounded-full'
          title='Add reaction'
        >
          <Smile className='h-3 w-3 sm:h-4 sm:w-4' />
        </Button>

        {showQuickReactions && (
          <div
            ref={quickReactionsRef}
            className={cn(
              'absolute z-50',
              'bottom-full',
              isOwn ? 'right-0 mb-1 transform -translate-x-2' : 'left-0 mb-1 transform translate-x-2',
            )}
            style={{
              maxWidth: '90vw',
            }}
          >
            <QuickReactions
              onReactionClick={handleReactionAdd}
              onClose={() => setShowQuickReactions(false)}
              showCloseButton={true}
            />
          </div>
        )}
      </div>

      {/* More Actions Button */}
      <div className='relative'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowMoreActions(!showMoreActions)}
          className='h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/80 rounded-full'
          title='More actions'
        >
          <MoreHorizontal className='h-3 w-3 sm:h-4 sm:w-4' />
        </Button>

        {showMoreActions && (
          <div
            ref={moreActionsRef}
            className={cn(
              'absolute z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[120px] sm:min-w-[140px] max-w-[200px]',
              'bottom-full',
              isOwn ? 'right-0 mb-1 transform -translate-x-2' : 'left-0 mb-1 transform translate-x-2',
            )}
            style={{
              maxWidth: '90vw',
            }}
          >
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className='w-full justify-start px-3 py-1 h-7 sm:h-8 text-xs sm:text-sm'
            >
              <Smile className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
              Add reaction
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={onCopyMessage}
              className='w-full justify-start px-3 py-1 h-7 sm:h-8 text-xs sm:text-sm'
            >
              <Copy className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
              Copy text
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={onReplyMessage}
              className='w-full justify-start px-3 py-1 h-7 sm:h-8 text-xs sm:text-sm'
            >
              <Reply className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
              Reply
            </Button>

            {isOwn && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onEditMessage}
                  className='w-full justify-start px-3 py-1 h-7 sm:h-8 text-xs sm:text-sm'
                >
                  <Edit className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
                  Edit
                </Button>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onDeleteMessage}
                  className='w-full justify-start px-3 py-1 h-7 sm:h-8 text-xs sm:text-sm text-destructive hover:text-destructive'
                >
                  <Trash2 className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={cn(
              'absolute z-50',
              'bottom-full',
              isOwn ? 'right-0 mb-1 transform -translate-x-4' : 'left-0 mb-1 transform translate-x-4',
            )}
            style={{
              maxWidth: '90vw',
            }}
          >
            <EmojiPicker onEmojiSelect={handleReactionAdd} keepOpenOnSelect={true} autoClose={false} />
          </div>
        )}
      </div>
    </div>
  );
};
