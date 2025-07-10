'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';

import { ChatContainer } from '@/components/chat';

export default function PractitionerMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setSidebarOpen } = useSidebar();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/practitioner/auth');
    }
  }, [status, router]);

  React.useEffect(() => {
    if (session?.error) {
      router.push('/practitioner/auth');
    }
  }, [session?.error, router]);

  React.useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') {
      if (session?.user?.role === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/practitioner/auth');
      }
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen w-full overflow-hidden'>
      <div className='p-4 sm:p-6 border-b border-border/60 bg-muted/5 flex-shrink-0'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>Messages</h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>Communicate with your clients</p>
          </div>
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-hidden p-1'>
        <ChatContainer height='calc(100vh - 200px)' className='w-full h-full' />
      </div>
    </div>
  );
}
