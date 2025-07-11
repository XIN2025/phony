'use client';
import { Card, CardContent } from '@repo/ui/components/card';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { MoreVertical, Plus, Search } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

const MOCK_JOURNALS = [
  {
    id: 1,
    title: 'Title',
    date: '12 Jun 2025',
  },
  {
    id: 2,
    title: 'Title',
    date: '12 Jun 2025',
  },
  {
    id: 3,
    title: 'Title',
    date: '12 Jun 2025',
  },
];

export default function JournalsPage() {
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
            className='pl-10 sm:pl-12 w-full rounded-full border border-[#E5D6D0] bg-transparent py-2 sm:py-3 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0'>
        {MOCK_JOURNALS.map((journal) => (
          <Card
            key={journal.id}
            className='flex flex-col p-0 overflow-hidden h-40 sm:h-48 min-w-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'
          >
            <div className='relative bg-gray-300 flex-1 flex items-center justify-center' />
            <CardContent className='flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-transparent border-t border-gray-200/60 min-w-0'>
              <div className='min-w-0 flex-1'>
                <div className='font-semibold text-sm leading-tight truncate text-gray-800'>{journal.title}</div>
                <div className='text-xs text-gray-600 mt-1'>{journal.date}</div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='ml-2 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-200/50'
              >
                <MoreVertical className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500' />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
