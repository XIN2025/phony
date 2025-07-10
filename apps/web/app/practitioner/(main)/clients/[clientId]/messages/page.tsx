'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { ChatContainer } from '@/components/chat';
import { useGetClients } from '@/lib/hooks/use-api';

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
      <div className='p-4 sm:p-6 border-b border-border/60 bg-muted/5 flex-shrink-0'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.push('/practitioner/clients')}
            className='text-gray-600 hover:text-gray-900 focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-6 w-6' />
          </button>
          <div className='flex-1'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white'>
              Messages with {clientId}
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base'>
              Direct messaging with your client
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-hidden p-1'>
        <ChatContainer participantId={clientId} height='calc(100vh - 200px)' className='w-full h-full' />
      </div>
    </div>
  );
}
