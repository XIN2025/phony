'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { ArrowLeft } from 'lucide-react';
import { useGetJournalEntry } from '@/lib/hooks/use-api';
import React from 'react';

export default function JournalEntryViewPage({ params }: { params: Promise<{ entryId: string }> }) {
  const router = useRouter();
  const { entryId } = React.use(params);
  const { data: entry, isLoading } = useGetJournalEntry(entryId);

  const parseJournalContent = (content: string) => {
    if (!content) return [];
    return content.split('<hr>').map((part, index) => {
      const titleMatch = part.match(/<h3>(.*?)<\/h3>/);
      const title = titleMatch && titleMatch[1] ? titleMatch[1] : `Section ${index + 1}`;

      const cleanContent = part.replace(/<h3>.*?<\/h3>/, '').trim();

      return { title, content: cleanContent };
    });
  };

  if (isLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }
  if (!entry) {
    return <div className='flex items-center justify-center min-h-screen'>Not found</div>;
  }
  const sections = parseJournalContent(entry.content);
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <div className='flex flex-col w-full pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-6 lg:px-8 min-h-screen max-w-full overflow-x-hidden'>
      {/* Page header with back button and title */}
      <div className='flex flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10 w-full gap-2 sm:gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <button
            onClick={() => router.back()}
            className='rounded-full p-2 hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors'
            aria-label='Back'
          >
            <ArrowLeft size={22} />
          </button>
          <h1
            className='text-2xl lg:text-3xl font-semibold mb-0 truncate'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {entry.title || 'Untitled Journal'}
          </h1>
        </div>
        <div className='text-sm text-gray-500'>{formatDate(entry.updatedAt || entry.createdAt)}</div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-full'>
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <Card key={index} className='bg-white border border-gray-200 shadow-none rounded-xl'>
              <CardContent className='p-4 min-h-[80px] sm:min-h-[120px] flex flex-col items-start'>
                <h3
                  className='text-sm font-semibold text-gray-900 mb-2'
                  style={{ fontFamily: "'DM Serif Display', serif" }}
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
            <CardContent className='p-4 min-h-[80px] sm:min-h-[120px] flex items-center justify-center'>
              <div
                className='prose prose-sm max-w-none text-gray-800 leading-relaxed w-full'
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
