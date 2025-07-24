'use client';
import { useGetClient } from '@/lib/hooks/use-api';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ClientPageHeader } from '@/components/practitioner/ClientPageHeader';
import { Button } from '@repo/ui/components/button';
import React from 'react';
import { Plus } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Get clientId from params (Next.js dynamic route)
  const params = useParams();
  const pathname = usePathname();
  const clientId = Array.isArray(params?.clientId) ? params.clientId[0] : params?.clientId;
  const { data: client, isLoading } = useGetClient(clientId || '');

  // Right actions for the header
  const rightActions = (
    <Button
      onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard/new-session`)}
      className='bg-[#807171] text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all w-full sm:w-auto min-w-0'
    >
      <Plus className='sm:h-4 sm:w-4 sm:mr-2 hidden ' />
      New Session
    </Button>
  );

  if (isLoading || !client) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  // Only show ClientPageHeader if not on the new-session page
  const isNewSessionPage = pathname.endsWith('/new-session');

  return (
    <div className='flex flex-col min-h-screen w-full'>
      {!isNewSessionPage && <ClientPageHeader client={client} rightActions={rightActions} />}
      <div className='flex-1 w-full min-w-0'>{children}</div>
    </div>
  );
}
