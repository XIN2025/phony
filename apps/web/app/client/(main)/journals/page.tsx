'use client';
import { Card, CardContent } from '@repo/ui/components/card';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { MoreVertical, Plus, Search, Edit, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useGetJournalEntries, useDeleteJournalEntry, JournalEntry } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';

export default function JournalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: journalEntries = [], isLoading } = useGetJournalEntries();
  const deleteJournalMutation = useDeleteJournalEntry();

  const filteredEntries = journalEntries.filter(
    (entry) =>
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleDeleteJournal = async (entryId: string) => {
    try {
      await deleteJournalMutation.mutateAsync(entryId);
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete journal entry');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEntryPreview = (content: string) => {
    // Remove HTML tags and get first 100 characters
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
  };

  return (
    <div className='flex flex-col w-full max-w-full overflow-x-hidden pt-4 sm:pt-6 px-4 sm:px-6 md:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'>Journal Entries</h1>
        </div>
        <Link href='/client/journals/new'>
          <Button className='rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium bg-black text-white hover:bg-gray-800 shadow-sm w-full sm:w-auto'>
            <Plus className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> New Entry
          </Button>
        </Link>
      </div>

      <div className='mb-6 sm:mb-8'>
        <div className='relative w-full max-w-md ml-0'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4'>
            <Search className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
          </div>
          <Input
            placeholder='Search Entry'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 sm:pl-12 w-full rounded-full border border-[#E5D6D0] bg-transparent py-2 sm:py-3 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
          />
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500 mb-4'>No journal entries found</p>
          <Link href='/client/journals/new'>
            <Button className='bg-black text-white rounded-full px-6 py-2'>
              <Plus className='mr-2 h-4 w-4' /> Create Your First Entry
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0'>
          {filteredEntries.map((entry: JournalEntry) => (
            <Card
              key={entry.id}
              className='flex flex-col p-0 overflow-hidden h-48 sm:h-56 min-w-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 hover:shadow-xl transition-shadow'
            >
              <div className='flex-1 p-4 overflow-hidden'>
                <div className='font-semibold text-sm leading-tight text-gray-800 mb-2'>
                  {entry.title || 'Untitled Entry'}
                </div>
                <div className='text-xs text-gray-500 mb-2'>{formatDate(entry.createdAt)}</div>
                <div className='text-sm text-gray-600 line-clamp-3'>{getEntryPreview(entry.content)}</div>
                {entry.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <CardContent className='flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-transparent border-t border-gray-200/60 min-w-0'>
                <div className='min-w-0 flex-1'>
                  <div className='text-xs text-gray-500'>{entry.isPrivate ? 'Private' : 'Public'}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='ml-2 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-200/50'
                    >
                      <MoreVertical className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Link href={`/client/journals/${entry.id}`}>
                        <Edit className='mr-2 h-4 w-4' />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteJournal(entry.id)} className='text-red-600'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
