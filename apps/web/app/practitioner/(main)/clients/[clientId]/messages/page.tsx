'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { ChatContainer } from '@/components/chat';
import { useGetClients } from '@/lib/hooks/use-api';
import { PageHeader } from '@/components/PageHeader';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

export default function ClientMessagesPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientId, setClientId] = React.useState<string>('');

  const { data: clients = [] } = useGetClients();

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
  const clientDisplayName = client ? `${client.firstName} ${client.lastName}` : 'Client';

  return (
    <div className='flex flex-col h-screen w-full overflow-hidden'>
      <PageHeader
        title={`Messages with ${clientDisplayName}`}
        subtitle='Direct messaging with your client'
        onBack={() => router.push('/practitioner/clients')}
        className='bg-muted/5'
        leftElement={<SidebarToggleButton />}
      />

      <div className='flex-1 min-h-0 px-14 overflow-hidden p-1'>
        <ChatContainer participantId={clientId} height='calc(100vh - 200px)' className='w-full h-full' />
      </div>
    </div>
  );
}
