import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Calendar, Heart, Target, MessageCircle, Smile, ArrowLeft } from 'lucide-react';

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
  onDelete?: () => void;
}

interface JournalSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({ open, onClose, journal, onDelete }) => {
  if (!journal) return null;

  const parseJournalContent = (content: string): JournalSection[] => {
    const sections: JournalSection[] = [];

    // Split content by <hr> tags
    const parts = content.split('<hr>');

    parts.forEach((part, index) => {
      if (!part.trim()) return;

      // Extract title from h3 tag
      const titleMatch = part.match(/<h3>(.*?)<\/h3>/);
      const title = titleMatch && titleMatch[1] ? titleMatch[1] : `Section ${index + 1}`;

      // Remove h3 tag to get content
      const cleanContent = part.replace(/<h3>.*?<\/h3>/, '').trim();

      if (cleanContent) {
        let icon: React.ReactNode;
        let color: string;

        // Determine icon and color based on title
        if (title.toLowerCase().includes('feeling')) {
          icon = <Smile className='w-4 h-4' />;
          color = 'bg-red-50/50 border-red-100';
        } else if (title.toLowerCase().includes('task') || title.toLowerCase().includes('feedback')) {
          icon = <Target className='w-4 h-4' />;
          color = 'bg-blue-50/50 border-blue-100';
        } else if (title.toLowerCase().includes('mind')) {
          icon = <MessageCircle className='w-4 h-4' />;
          color = 'bg-green-50/50 border-green-100';
        } else {
          icon = <MessageCircle className='w-4 h-4' />;
          color = 'bg-gray-50/50 border-gray-100';
        }

        sections.push({
          title,
          content: cleanContent,
          icon,
          color,
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
      <DialogContent className='w-[98vw] max-w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden mx-2 sm:mx-auto'>
        <div className='flex items-center gap-2 mb-4'>
          <Button onClick={onClose} variant='ghost' className='p-2 rounded-full'>
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <span className='text-lg sm:text-xl font-semibold' style={{ fontFamily: "'Playfair Display', serif" }}>
            {journal.title || 'Untitled Journal'}
          </span>
        </div>
        <div className='text-xs text-gray-500 mb-6 px-2'>{formatDate(journal.updatedAt || journal.createdAt)}</div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 px-2'>
          {sections.length > 0 ? (
            sections.map((section, index) => (
              <Card key={index} className='bg-white border border-gray-200 shadow-none rounded-xl'>
                <CardContent className='p-4 min-h-[80px] sm:min-h-[120px] flex items-start'>
                  <h3
                    className='text-sm font-semibold text-gray-900 mb-2'
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {section.title}
                  </h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-800 leading-relaxed w-full'
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className='bg-white border border-gray-200 shadow-none rounded-xl col-span-3'>
              <CardContent className='p-4 min-h-[120px] flex items-center justify-center'>
                <div
                  className='prose prose-sm max-w-none text-gray-800 leading-relaxed w-full'
                  dangerouslySetInnerHTML={{ __html: journal.content }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
