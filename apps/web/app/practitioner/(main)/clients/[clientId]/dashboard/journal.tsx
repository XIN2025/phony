import { useMemo } from 'react';
import { Card } from '@repo/ui/components/card';
import { useGetClientJournalEntries } from '@/lib/hooks/use-api';
import { isSameDay } from '@/lib/utils';

export default function JournalTab({
  clientId,
  dateRange,
  handleJournalClick,
}: {
  clientId: string;
  dateRange: { startDate: Date; endDate: Date };
  handleJournalClick: (journal: any) => void;
}) {
  const { data: journalEntries = [] } = useGetClientJournalEntries(clientId);
  const filteredJournals = useMemo(() => {
    const { startDate, endDate } = dateRange;
    return (journalEntries || []).filter((j: any) => {
      const d = new Date(j.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [journalEntries, dateRange]);

  return (
    <div className='mt-0'>
      {filteredJournals.length === 0 ? (
        <div className='text-center text-muted-foreground py-8'>No journal entries found for this client.</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 min-w-0'>
          {filteredJournals.map((entry: any) => {
            const previewText = (() => {
              const sections = entry.content.split('<hr>').filter((section: string) => section.trim());
              const contentSnippets: string[] = [];
              sections.forEach((section: string) => {
                const cleanContent = section.replace(/<h3>.*?<\/h3>/, '').trim();
                if (cleanContent) {
                  const textContent = cleanContent.replace(/<[^>]*>/g, '');
                  if (textContent.length > 0) {
                    const snippet = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
                    contentSnippets.push(snippet);
                  }
                }
              });
              if (contentSnippets.length > 0) {
                return contentSnippets.slice(0, 2).join(' • ');
              }
              const textContent = entry.content.replace(/<[^>]*>/g, '');
              return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
            })();
            return (
              <Card
                key={entry.id}
                className='flex flex-col p-0 overflow-hidden h-48 sm:h-56 lg:h-64 xl:h-72 min-w-0 w-full bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 hover:shadow-xl transition-shadow cursor-pointer'
                onClick={() => handleJournalClick(entry)}
              >
                <div className='flex-1 p-3 sm:p-4 lg:p-3 overflow-hidden'>
                  <div className='font-semibold text-sm sm:text-base leading-tight text-gray-800 mb-2'>
                    {entry.title || 'Untitled Entry'}
                  </div>
                  <div className='text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3'>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className='text-sm sm:text-base text-gray-600 line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 xl:line-clamp-6'>
                    {previewText}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
