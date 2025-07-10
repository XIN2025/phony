'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { PageHeader } from '@/components/PageHeader';

import { ChatContainer } from '@/components/chat';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

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
      <PageHeader
        title='Messages'
        subtitle='Communicate with your clients'
        showBackButton={false}
        className='bg-muted/5'
        children={<SidebarToggleButton />}
      />

      <div className='flex-1 min-h-0 overflow-hidden px-14 p-1'>
        <ChatContainer height='calc(100vh - 200px)' className='w-full h-full' />
      </div>
    </div>
  );
}
