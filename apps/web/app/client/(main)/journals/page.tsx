'use client';
import { Card, CardContent } from '@repo/ui/components/card';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { MoreVertical, Plus } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

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
    <div className='flex flex-col flex-1 h-full w-full p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2'>
        <h1 className='text-xl sm:text-2xl font-bold truncate'>Journal Entries</h1>
        <Link href='/client/journals/new'>
          <Button className='w-full sm:w-auto' variant='default' size='lg'>
            <Plus className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> New Entry
          </Button>
        </Link>
      </div>
      <div className='w-full max-w-3xl min-w-0'>
        <Input
          placeholder='Search Entry'
          className='rounded-full px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 shadow-sm focus:border-black focus:ring-2 focus:ring-black/10'
        />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-2 min-w-0'>
        {MOCK_JOURNALS.map((journal) => (
          <Card key={journal.id} className='flex flex-col p-0 overflow-hidden h-40 sm:h-48 min-w-0'>
            <div className='relative bg-gray-300 flex-1 flex items-center justify-center' />
            <CardContent className='flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-t border-gray-200 min-w-0'>
              <div className='min-w-0 flex-1'>
                <div className='font-semibold text-sm leading-tight truncate'>{journal.title}</div>
                <div className='text-xs text-muted-foreground mt-1'>{journal.date}</div>
              </div>
              <Button variant='ghost' size='icon' className='ml-2 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10'>
                <MoreVertical className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500' />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
