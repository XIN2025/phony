'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { PageHeader } from '@/components/PageHeader';

import { ChatContainer } from '@/components/chat';

export default function PractitionerMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setSidebarOpen } = useSidebar();

  const [chatHeight, setChatHeight] = useState(() => {
    // Set initial height based on screen size
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return '80vh';
    }
    return 'calc(100vh - 128px)';
  });

  useEffect(() => {
    const updateHeight = () => {
      const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint

      if (isLargeScreen) {
        // On large screens, use a fixed height for better centering
        setChatHeight('80vh');
      } else {
        // Calculate available height: viewport height - header height - bottom navigation height
        const headerHeight = 64; // PractitionerHeader height
        const bottomNavHeight = 64; // BottomNavigation height
        const totalOffset = headerHeight + bottomNavHeight;

        setChatHeight(`calc(100vh - ${totalOffset}px)`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
    <div className='flex flex-col w-full pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-6 lg:px-8 h-full overflow-hidden'>
      {/* Chat container that takes calculated available space */}
      <div className='flex-1 min-h-0 w-full lg:w-full lg:max-h-[80vh] overflow-hidden'>
        <ChatContainer height={chatHeight} className='w-full h-full lg:h-auto lg:max-h-[80vh] overflow-hidden' />
      </div>
    </div>
  );
}
