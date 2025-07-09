'use client';
import {
  InvitationResponse,
  useCleanupExpiredInvitations,
  useDeleteInvitation,
  useGetInvitations,
  useResendInvitation,
  useGetClients,
} from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Eye, Loader2, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LoadingSpinner = () => (
  <div className='flex h-screen items-center justify-center'>
    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
  </div>
);

const getClientDisplayName = (client: InvitationResponse): string => {
  if (client.clientFirstName && client.clientLastName) {
    return `${client.clientFirstName} ${client.clientLastName}`;
  }
  return client.clientFirstName || client.clientLastName || client.clientEmail?.split('@')[0] || 'Client';
};

export default function PractitionerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: invitations = [], isLoading: isInvitationsLoading } = useGetInvitations();
  const { data: clients = [] } = useGetClients();
  const { mutate: deleteInvitation, isPending: isDeleting } = useDeleteInvitation();
  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();
  const { mutate: cleanupExpiredInvitations, isPending: isCleaningUp } = useCleanupExpiredInvitations();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[PractitionerDashboard] Component mounted', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    console.log('[PractitionerDashboard] Session update:', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      userName: session?.user ? `${session.user.firstName} ${session.user.lastName}` : null,
    });
  }, [session, status]);

  // Handle navigation for unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/practitioner/auth');
    }
  }, [status, router]);

  // Handle navigation for users with errors
  useEffect(() => {
    if (session?.error) {
      router.push('/practitioner/auth');
    }
  }, [session?.error, router]);

  // Handle navigation for wrong role users
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') {
      if (session?.user?.role === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/practitioner/auth');
      }
    }
  }, [status, session?.user?.role, router]);

  // Mock data for Unread Messages and Unread Journals
  const unreadMessages = 2;
  const unreadJournals = 5;

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');
  const joinedClients = invitations.filter((inv) => inv.status === 'JOINED');
  const totalClients = invitations.length;

  // Helper for Plan Engagement badge
  const getPlanEngagement = (client: any) => {
    // For now, cycle through High/Medium/Low for demo
    const idx = joinedClients.findIndex((c) => c.id === client.id);
    const options = ['High', 'Medium', 'Low'];
    return options[idx % options.length];
  };
  const getPlanBadgeColor = (level: string) => {
    if (level === 'High') return 'bg-green-200 text-green-800';
    if (level === 'Medium') return 'bg-blue-200 text-blue-800';
    if (level === 'Low') return 'bg-red-200 text-red-800';
    return 'bg-gray-200 text-gray-800';
  };
  const getLastSession = (client: any) => 'May 10, 2025';
  const getLastActive = (client: any) => 'May 10, 2025';

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    session?.error ||
    (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') ||
    isInvitationsLoading
  ) {
    return <LoadingSpinner />;
  }

  return (
    <div className='flex flex-col w-full px-0 py-0 font-sans'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 px-8 pt-10 w-full'>
        <h1 className='text-3xl font-semibold mb-4 sm:mb-0'>
          Welcome Back{session?.user?.firstName ? ` Dr. ${session.user.firstName}` : ''}
        </h1>
        <Button
          className='rounded-full px-6 py-2 text-base font-medium bg-black text-white hover:bg-gray-900 shadow'
          asChild
        >
          <Link href='/practitioner/invite'>+ Invite Client</Link>
        </Button>
      </div>
      {/* Stat Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10 px-8 w-full'>
        {/* Total Clients Card */}
        <Card className='relative flex flex-col justify-between min-h-[120px] shadow-2xl rounded-2xl border-0 w-full'>
          <CardContent className='p-7'>
            <span className='text-sm font-semibold text-gray-700 mb-1'>Total Clients</span>
            <span className='text-3xl font-bold mb-1'>{totalClients}</span>
            <span className='text-xs text-green-600'>+2 from last month</span>
          </CardContent>
        </Card>
        {/* Unread Messages Card */}
        <Card className='relative flex flex-col justify-between min-h-[120px] shadow-2xl rounded-2xl border-0 w-full'>
          <CardContent className='p-7'>
            <span className='text-sm font-semibold text-gray-700 mb-1'>Unread Messages</span>
            <span className='text-3xl font-bold mb-1'>{unreadMessages}</span>
            <span className='text-xs text-gray-400'>&nbsp;</span>
            <span className='absolute right-4 bottom-4 opacity-30'>
              {/* Large mail icon */}
              <svg width='56' height='56' viewBox='0 0 56 56' fill='none'>
                <rect x='8' y='16' width='40' height='24' rx='6' stroke='#b7a9a3' strokeWidth='4' />
                <path d='M8 20l20 14 20-14' stroke='#b7a9a3' strokeWidth='3' fill='none' />
              </svg>
            </span>
          </CardContent>
        </Card>
        {/* Unread Journals Card */}
        <Card className='relative flex flex-col justify-between min-h-[120px] shadow-2xl rounded-2xl border-0 w-full'>
          <CardContent className='p-7'>
            <span className='text-sm font-semibold text-gray-700 mb-1'>Unread Journals</span>
            <span className='text-3xl font-bold mb-1'>{unreadJournals}</span>
            <span className='text-xs text-gray-400'>&nbsp;</span>
            <span className='absolute right-4 bottom-4 opacity-30'>
              {/* Large journal/book icon */}
              <svg width='56' height='56' viewBox='0 0 56 56' fill='none'>
                <rect x='14' y='10' width='28' height='36' rx='6' stroke='#b7a9a3' strokeWidth='4' />
                <path d='M22 18h12M22 28h12M22 38h12' stroke='#b7a9a3' strokeWidth='3' />
              </svg>
            </span>
          </CardContent>
        </Card>
      </div>
      {/* Last Active Clients Table */}
      <Card className='rounded-2xl shadow-2xl border-0 mx-8 mb-10 w-full'>
        <CardContent className='p-8'>
          <h2 className='text-lg font-semibold mb-6'>Last Active Clients</h2>
          <div className='overflow-x-auto'>
            <Table className='min-w-full text-sm'>
              <TableHeader>
                <TableRow className='border-b'>
                  <TableHead className='py-2 px-4 text-left font-medium'>Member</TableHead>
                  <TableHead className='py-2 px-4 text-left font-medium'>Last Session</TableHead>
                  <TableHead className='py-2 px-4 text-left font-medium'>Plan Engagement</TableHead>
                  <TableHead className='py-2 px-4 text-left font-medium'>Last Active</TableHead>
                  <TableHead className='py-2 px-4 text-left font-medium'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: any) => {
                  const planLevel = getPlanEngagement(client);
                  return (
                    <TableRow key={client.id} className='border-b last:border-b-0 hover:bg-gray-50 transition-colors'>
                      <TableCell className='py-3 px-4 flex items-center gap-3'>
                        <Avatar className='h-8 w-8 rounded-full'>
                          <AvatarImage
                            src={getAvatarUrl(client.avatarUrl, {
                              firstName: client.firstName,
                              lastName: client.lastName,
                            })}
                          />
                          <AvatarFallback>
                            {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>
                          {client.firstName} {client.lastName}
                        </span>
                      </TableCell>
                      <TableCell className='py-3 px-4'>{getLastSession(client)}</TableCell>
                      <TableCell className='py-3 px-4'>
                        <span
                          className={`rounded-full px-4 py-1 text-xs font-semibold ${getPlanBadgeColor(planLevel || '')}`}
                        >
                          {planLevel}
                        </span>
                      </TableCell>
                      <TableCell className='py-3 px-4'>{getLastActive(client)}</TableCell>
                      <TableCell className='py-3 px-4'>
                        <div className='flex gap-2'>
                          <Link
                            href={`/practitioner/clients/${client.id}/messages`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant='ghost' size='icon' className='rounded-full p-2'>
                              <MessageSquare className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Link
                            href={`/practitioner/clients/${client.id}/dashboard`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant='ghost' size='icon' className='rounded-full p-2'>
                              <Eye className='h-4 w-4' />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Pending Invitations Section (optional, can be moved below or removed) */}
    </div>
  );
}
