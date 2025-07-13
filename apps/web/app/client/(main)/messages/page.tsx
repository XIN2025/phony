'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { ChatContainer } from '@/components/chat';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

const ClientMessagesPage = () => {
  const { setSidebarOpen } = useSidebar();
  return (
    <div className='flex flex-col w-full pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0 h-screen'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1
            className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Messages
          </h1>
        </div>
        <div className='text-sm sm:text-base text-gray-600'>Communicate with your practitioner</div>
      </div>

      <div className='flex-1 min-h-0 overflow-hidden bg-transparent rounded-2xl'>
        <ChatContainer height='calc(100vh - 240px)' className='w-full h-full rounded-2xl' />
      </div>
    </div>
  );
};

export default ClientMessagesPage;
