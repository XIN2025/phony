'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { ChatContainer } from '@/components/chat';
import { PageHeader } from '@/components/PageHeader';

const ClientMessagesPage = () => {
  const { setSidebarOpen } = useSidebar();
  return (
    <div className='flex flex-col h-screen w-full overflow-hidden min-w-0'>
      <PageHeader
        title='Messages'
        subtitle='Communicate with your practitioner'
        showBackButton={false}
        className='bg-muted/5'
        leftElement={
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden h-8 w-8 sm:h-10 sm:w-10'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
        }
      />

      <div className='flex-1 min-h-0 overflow-hidden p-1 min-w-0'>
        <ChatContainer height='calc(100vh - 180px)' className='w-full h-full' />
      </div>
    </div>
  );
};

export default ClientMessagesPage;
