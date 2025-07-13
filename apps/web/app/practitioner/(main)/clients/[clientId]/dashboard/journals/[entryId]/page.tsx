'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { ArrowLeft } from 'lucide-react';
import { useGetClientJournalEntries } from '@/lib/hooks/use-api';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function PractitionerJournalEntryViewPage({
  params,
}: {
  params: Promise<{ clientId: string; entryId: string }>;
}) {
  const router = useRouter();
  const { clientId, entryId } = React.use(params);
  const { data: entries, isLoading, error } = useGetClientJournalEntries(clientId);
  const entry = entries?.find((e) => e.id === entryId);

  const parseJournalContent = (content: string) => {
    if (!content) return [];
    return content.split('<hr>').map((part, index) => {
      // Extract title from h3 tag
      const titleMatch = part.match(/<h3>(.*?)<\/h3>/);
      const title = titleMatch && titleMatch[1] ? titleMatch[1] : `Section ${index + 1}`;

      // Remove h3 tag to get content
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
    <div className='flex flex-col w-full min-h-screen'>
      <PageHeader
        title={entry.title || 'Untitled Journal'}
        subtitle={formatDate(entry.updatedAt || entry.createdAt)}
        onBack={() => router.back()}
        showBackButton
        className='mb-4 border-b-0 px-4 sm:px-8 pt-6'
      />
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 sm:px-8'>
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <Card key={index} className='bg-white border border-gray-200 shadow-none rounded-xl'>
              <CardContent className='p-4 min-h-[120px] flex flex-col items-start'>
                <h3 className='text-sm font-semibold text-gray-900 mb-2'>{section.title}</h3>
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
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
