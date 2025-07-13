'use client';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { JournalEntry, useDeleteJournalEntry, useGetJournalEntries } from '@/lib/hooks/use-api';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function JournalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: journalEntries = [], isLoading } = useGetJournalEntries();
  const deleteJournalMutation = useDeleteJournalEntry();
  const router = useRouter();

  const filteredEntries = journalEntries.filter(
    (entry) =>
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteJournal = async (entryId: string) => {
    try {
      await deleteJournalMutation.mutateAsync(entryId);
      toast.success('Journal entry deleted successfully');
      if (selectedEntry?.id === entryId) {
        setIsModalOpen(false);
        setSelectedEntry(null);
      }
    } catch (error) {
      toast.error('Failed to delete journal entry');
    }
  };

  const handleViewEntry = (entry: JournalEntry) => {
    router.push(`/client/journals/${entry.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEntryPreview = (content: string) => {
    const sections = content.split('<hr>');
    const contentSnippets: string[] = [];

    sections.forEach((section) => {
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

    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
  };

  return (
    <div className='flex flex-col w-full max-w-full overflow-x-hidden pt-2 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6 lg:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1
            className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-0 truncate'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Journal Entries
          </h1>
        </div>
        <Link href='/client/journals/new' className='w-full sm:w-auto'>
          <Button className='rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium bg-black text-white hover:bg-gray-800 shadow-sm w-full'>
            <Plus className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> New Entry
          </Button>
        </Link>
      </div>

      <div className='mb-4 sm:mb-6 md:mb-8'>
        <div className='relative w-full max-w-md'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4'>
            <Search className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
          </div>
          <Input
            placeholder='Search Entry'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 sm:pl-12 w-full rounded-full border border-[#E5D6D0] bg-transparent py-2.5 sm:py-3 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
          />
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-8 sm:py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className='text-center py-8 sm:py-12'>
          <p className='text-gray-500 mb-4 text-sm sm:text-base'>No journal entries found</p>
          <Link href='/client/journals/new'>
            <Button className='bg-black text-white rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base'>
              <Plus className='mr-2 h-4 w-4' /> Create Your First Entry
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 min-w-0'>
          {filteredEntries.map((entry: JournalEntry) => (
            <Card
              key={entry.id}
              className='flex flex-col justify-between p-0 overflow-hidden h-44 sm:h-48 md:h-56 min-w-0 bg-white shadow rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow relative'
            >
              <div
                className='flex-1 p-4 overflow-hidden cursor-pointer flex flex-col justify-between'
                onClick={() => handleViewEntry(entry)}
              >
                <div className='text-xs text-gray-500 mb-2'>{formatDate(entry.updatedAt || entry.createdAt)}</div>
                <div className='text-sm text-gray-700 line-clamp-4 flex-1'>{getEntryPreview(entry.content)}</div>
              </div>
              <div className='px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-700 font-medium truncate flex items-center justify-between'>
                <span className='truncate flex-1'>{entry.title || 'Untitled Journal'}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-600 ml-2 flex-shrink-0'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteJournal(entry.id);
                  }}
                >
                  <Trash2 className='h-3 w-3' />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
