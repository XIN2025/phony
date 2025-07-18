'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { ChatContainer } from '@/components/chat';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { getAvatarUrl, getUserDisplayName, getInitials } from '@/lib/utils';

const ClientMessagesPage = () => {
  const { setSidebarOpen } = useSidebar();
  const { data: currentUser } = useGetCurrentUser();
  return (
    <div className='flex flex-col w-full min-w-0 max-w-full overflow-x-hidden flex-1 min-h-0 h-[100dvh] sm:pt-6 sm:px-4 sm:lg:px-6 sm:xl:px-8'>
      {/* Mobile header - only on small screens */}
      <div className='flex items-center justify-between px-4 pt-4 pb-2 w-full sm:hidden'>
        <div className='flex items-center'>
          <SidebarToggleButton />
          <span
            className='ml-3 text-xl font-bold text-primary'
            style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '0.05em' }}
          >
            Continuum
          </span>
        </div>
        <Avatar className='h-10 w-10 ml-2'>
          <AvatarImage
            src={getAvatarUrl(currentUser?.avatarUrl, currentUser)}
            alt={getUserDisplayName(currentUser) || 'User'}
          />
          <AvatarFallback>{getInitials(currentUser || 'U')}</AvatarFallback>
        </Avatar>
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <h1
            className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate pl-4 sm:pl-0'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Messages
          </h1>
        </div>
        <div className='text-sm sm:text-base text-gray-600'>Communicate with your practitioner</div>
      </div>

      <div className='flex-1 min-h-0 overflow-hidden bg-transparent rounded-2xl'>
        <ChatContainer height='100%' className='w-full h-full rounded-2xl' />
      </div>
    </div>
  );
};

export default ClientMessagesPage;
