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
    <div className='flex flex-col flex-1 h-full w-full p-6 gap-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2'>
        <h1 className='text-2xl font-bold'>Journal Entries</h1>
        <Link href='/client/journals/new'>
          <Button className='ml-auto w-fit' variant='default' size='lg'>
            <Plus className='mr-2 h-5 w-5' /> New Entry
          </Button>
        </Link>
      </div>
      {/* Search Bar */}
      <div className='w-full max-w-3xl'>
        <Input
          placeholder='Search Entry'
          className='rounded-full px-5 py-3 text-base bg-white border border-gray-300 shadow-sm focus:border-black focus:ring-2 focus:ring-black/10'
        />
      </div>
      {/* Journal Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2'>
        {MOCK_JOURNALS.map((journal) => (
          <Card key={journal.id} className='flex flex-col p-0 overflow-hidden h-48'>
            {/* Card Top: Grey preview only, no avatar */}
            <div className='relative bg-gray-300 flex-1 flex items-center justify-center' />
            {/* Card Bottom: Title, Date, Menu */}
            <CardContent className='flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200'>
              <div>
                <div className='font-semibold text-sm leading-tight'>{journal.title}</div>
                <div className='text-xs text-muted-foreground mt-1'>{journal.date}</div>
              </div>
              <Button variant='ghost' size='icon' className='ml-2'>
                <MoreVertical className='h-5 w-5 text-gray-500' />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
