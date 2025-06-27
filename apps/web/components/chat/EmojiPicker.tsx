'use client';

import React, { useState, useRef, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@repo/ui/components/button';
import { Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  autoClose?: boolean; // New prop to control auto-close behavior
  keepOpenOnSelect?: boolean; // Alternative prop name for clarity
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  className,
  autoClose = true,
  keepOpenOnSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    // Only close if autoClose is true and keepOpenOnSelect is false
    if (autoClose && !keepOpenOnSelect) {
      setIsOpen(false);
    }
  };

  const pickerWidth = isMobile ? Math.min(280, window.innerWidth - 40) : 300;
  const pickerHeight = isMobile ? 350 : 400;

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={buttonRef}
        variant='ghost'
        size='sm'
        onClick={() => setIsOpen(!isOpen)}
        className='h-8 w-8 p-0 hover:bg-muted'
        type='button'
      >
        <Smile className='h-4 w-4' />
      </Button>

      {isOpen && (
        <div
          ref={pickerRef}
          className='absolute bottom-full mb-2 z-50 shadow-lg rounded-lg border bg-background'
          style={{
            transform: 'translateX(-50%)',
            left: '50%',
            maxWidth: '90vw',
          }}
        >
          {/* Close button when keepOpenOnSelect is true */}
          {keepOpenOnSelect && (
            <div className='flex justify-end p-2 border-b'>
              <Button variant='ghost' size='sm' onClick={() => setIsOpen(false)} className='h-6 w-6 p-0 hover:bg-muted'>
                <X className='h-3 w-3' />
              </Button>
            </div>
          )}
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            width={pickerWidth}
            height={pickerHeight}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};
