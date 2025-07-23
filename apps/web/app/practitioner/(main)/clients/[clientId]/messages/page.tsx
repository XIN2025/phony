'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { ChatContainer } from '@/components/chat';
import { useGetClients } from '@/lib/hooks/use-api';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';

export default function ClientMessagesPage({ params }: { params: Promise<{ clientId: string }> }) {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientId, setClientId] = React.useState<string>('');
  const { data: clients = [] } = useGetClients();

  // Responsive chat height logic (copied from /practitioner/messages)
  const [chatHeight, setChatHeight] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return '80vh';
    }
    return 'calc(100vh - 128px)';
  });

  useEffect(() => {
    const updateHeight = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen) {
        setChatHeight('80vh');
      } else {
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
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

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

  if (status === 'loading' || !clientId) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
      </div>
    );
  }

  const client = clients.find((c) => c.id === clientId);
  const clientDisplayName = client ? `${client.firstName} ${client.lastName}` : 'Messages';
  const headerTitle = isMobile ? undefined : clientDisplayName;

  return (
    <div className='flex flex-col h-screen w-full max-w-full overflow-x-hidden'>
      <PageHeader
        {...(headerTitle ? { title: headerTitle } : {})}
        onBack={() => router.push('/practitioner/clients')}
        className='bg-muted/5'
      />
      <div className='flex-1 min-h-0 px-2 sm:px-6 md:px-14 overflow-hidden p-1'>
        <ChatContainer participantId={clientId} height={chatHeight} className='w-full h-full' />
      </div>
    </div>
  );
}
