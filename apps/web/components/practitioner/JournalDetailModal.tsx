import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { useMarkJournalAsRead } from '@/lib/hooks/use-unread-journals';

interface JournalDetailModalProps {
  open: boolean;
  onClose: () => void;
  journal: {
    id: string;
    title?: string;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
  } | null;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({ open, onClose, journal }) => {
  const markAsRead = useMarkJournalAsRead();

  useEffect(() => {
    if (open && journal?.id) {
      markAsRead.mutate(journal.id);
    }
  }, [open, journal?.id, markAsRead]);

  if (!journal) return null;

  const parseJournalContent = (content: string): { title: string; content: string }[] => {
    const sections: { title: string; content: string }[] = [];

    const parts = content.split('<hr>');

    parts.forEach((part, index) => {
      if (!part.trim()) return;

      const titleMatch = part.match(/<h3>(.*?)<\/h3>/);
      const title = titleMatch && titleMatch[1] ? titleMatch[1] : `Section ${index + 1}`;

      const cleanContent = part.replace(/<h3>.*?<\/h3>/, '').trim();

      if (cleanContent) {
        sections.push({
          title,
          content: cleanContent,
        });
      }
    });

    return sections;
  };

  const sections = parseJournalContent(journal.content);
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='!fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 w-[90vw] max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl !z-[9999]'>
        <DialogHeader>
          <DialogTitle className='sr-only'>Journal Entry Details</DialogTitle>
        </DialogHeader>
        <div className='mb-4 px-6 pt-6'>
          <span className='text-xl sm:text-2xl font-semibold' style={{ fontFamily: "'Playfair Display', serif" }}>
            {journal.title || 'Untitled Journal Entry'}
          </span>
        </div>
        <div className='text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-6'>
          {formatDate(journal.updatedAt || journal.createdAt)}
        </div>
        {sections.length > 0 ? (
          <div className='space-y-6 px-6 pb-6 overflow-y-auto max-h-[calc(80vh-120px)]'>
            {sections.map((section, index) => (
              <div
                key={index}
                className='bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 shadow-sm'
              >
                <h3
                  className='text-lg sm:text-xl font-semibold text-gray-800 mb-4'
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {section.title}
                </h3>
                <div
                  className='prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed'
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 mx-6 mb-6 shadow-sm'>
            <div
              className='prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed'
              dangerouslySetInnerHTML={{ __html: journal.content }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
