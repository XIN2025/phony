'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Users, FileText, Plus, LogOut, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@repo/ui/components/skeleton';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function PractitionerDashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => ApiClient.get('/api/practitioner/clients'),
    enabled: !!session,
  });

  const { data: invitations, isLoading: invitesLoading } = useQuery<any[]>({
    queryKey: ['invitations'],
    queryFn: () => ApiClient.get('/api/practitioner/invitations'),
    enabled: !!session,
  });

  const isLoading = clientsLoading || invitesLoading;

  return (
    <main className='flex-1 space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Practitioner'}!
          </h1>
          <p className='text-muted-foreground'>Here's a summary of your practice.</p>
        </div>
        <Button onClick={() => router.push('/practitioner/invite')}>
          <Plus className='mr-2 h-4 w-4' />
          Invite Client
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Clients</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-1/4' />
            ) : (
              <div className='text-2xl font-bold'>{clients?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Invitations</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-1/4' />
            ) : (
              <div className='text-2xl font-bold'>
                {invitations?.filter((inv) => inv.status === 'pending').length ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Completion Rate</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>78%</div>
            <p className='text-xs text-muted-foreground'>Based on last 10 intake forms</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last Active Clients</CardTitle>
          <CardDescription>An overview of your most recently active clients.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : clients && clients.length > 0 ? (
            <div className='space-y-2'>
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className='flex items-center justify-between rounded-md border p-3'>
                  <div>
                    <p className='font-medium'>{client.name}</p>
                    <p className='text-sm text-muted-foreground'>{new Date(client.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/practitioner/clients/${client.id}`}>
                    <Button variant='outline' size='sm'>
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-10'>
              <p className='text-muted-foreground'>You have no active clients yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
