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
import { Eye, Loader2, MessageSquare, Users, BookText, Inbox } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

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
  const { data: user, isLoading: isUserLoading } = useGetCurrentUser();
  const router = useRouter();

  const { data: invitations = [], isLoading: isInvitationsLoading } = useGetInvitations();
  const { data: clients = [] } = useGetClients();
  const { mutate: deleteInvitation, isPending: isDeleting } = useDeleteInvitation();
  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();
  const { mutate: cleanupExpiredInvitations, isPending: isCleaningUp } = useCleanupExpiredInvitations();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/practitioner/auth');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.error) {
      router.push('/practitioner/auth');
    }
  }, [session?.error, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') {
      if (session?.user?.role === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/practitioner/auth');
      }
    }
  }, [status, session?.user?.role, router]);

  const unreadMessages = 2;
  const unreadJournals = 5;

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');
  const joinedClients = invitations.filter((inv) => inv.status === 'JOINED');
  const totalClients = invitations.length;

  const getPlanEngagement = (client: any) => {
    const idx = joinedClients.findIndex((c) => c.id === client.id);
    const options = ['High', 'Medium', 'Low'];
    return options[idx % options.length];
  };
  const getPlanBadgeColor = (level: string) => {
    if (level === 'High') return 'bg-green-100 text-green-700';
    if (level === 'Medium') return 'bg-blue-100 text-blue-700';
    if (level === 'Low') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };
  const getLastSession = (client: any) => 'May 10, 2025';
  const getLastActive = (client: any) => 'May 10, 2025';

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    session?.error ||
    (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') ||
    isInvitationsLoading ||
    isUserLoading
  ) {
    return <LoadingSpinner />;
  }

  return (
    <div className='flex flex-col w-full pt-6 px-4 sm:px-6 lg:px-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 w-full'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-3xl font-semibold mb-4 sm:mb-0'>
            Welcome Back{user?.firstName ? ` Dr. ${user.firstName}` : ''}
          </h1>
        </div>
        <Button
          className='rounded-full px-6 py-3 text-base font-medium bg-black text-white hover:bg-gray-800 shadow-sm'
          asChild
        >
          <Link href='/practitioner/invite'>+ Invite Client</Link>
        </Button>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full'>
        <Card className='flex flex-col justify-between p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-gray-600'>Total Clients</span>
              <span className='text-4xl font-bold'>{totalClients}</span>
              <span className='text-xs text-green-600 mt-1'>+2 from last month</span>
            </div>
            <div className='p-3 bg-gray-200/50 rounded-full'>
              <Users className='h-6 w-6 text-gray-700' />
            </div>
          </div>
        </Card>
        <Card className='flex flex-col justify-between p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-gray-600'>Unread Messages</span>
              <span className='text-4xl font-bold'>{unreadMessages}</span>
              <span className='text-xs text-transparent mt-1'>&nbsp;</span>
            </div>
            <div className='p-3 bg-gray-200/50 rounded-full'>
              <Inbox className='h-6 w-6 text-gray-700' />
            </div>
          </div>
        </Card>
        <Card className='flex flex-col justify-between p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-gray-600'>Unread Journals</span>
              <span className='text-4xl font-bold'>{unreadJournals}</span>
              <span className='text-xs text-transparent mt-1'>&nbsp;</span>
            </div>
            <div className='p-3 bg-gray-200/50 rounded-full'>
              <BookText className='h-6 w-6 text-gray-700' />
            </div>
          </div>
        </Card>
      </div>
      <Card className='rounded-2xl shadow-xl border-white/50 border bg-white/60 backdrop-blur-sm w-full'>
        <CardContent className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Last Active Clients</h2>
          <div className='overflow-x-auto'>
            <Table className='min-w-full text-sm'>
              <TableHeader>
                <TableRow className='border-b border-gray-200/60'>
                  <TableHead className='py-3 px-4 text-left font-semibold text-gray-600'>Member</TableHead>
                  <TableHead className='py-3 px-4 text-left font-semibold text-gray-600'>Last Session</TableHead>
                  <TableHead className='py-3 px-4 text-left font-semibold text-gray-600'>Plan Engagement</TableHead>
                  <TableHead className='py-3 px-4 text-left font-semibold text-gray-600'>Last Active</TableHead>
                  <TableHead className='py-3 px-4 text-left font-semibold text-gray-600'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: any) => {
                  const planLevel = getPlanEngagement(client);
                  return (
                    <TableRow
                      key={client.id}
                      className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/30 transition-colors'
                    >
                      <TableCell className='py-4 px-4 flex items-center gap-3'>
                        <Avatar className='h-9 w-9 rounded-full'>
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
                        <span className='font-medium text-gray-800'>
                          {client.firstName} {client.lastName}
                        </span>
                      </TableCell>
                      <TableCell className='py-4 px-4 text-gray-700'>{getLastSession(client)}</TableCell>
                      <TableCell className='py-4 px-4'>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getPlanBadgeColor(
                            planLevel || '',
                          )}`}
                        >
                          {planLevel}
                        </span>
                      </TableCell>
                      <TableCell className='py-4 px-4 text-gray-700'>{getLastActive(client)}</TableCell>
                      <TableCell className='py-4 px-4'>
                        <div className='flex gap-2'>
                          <Link
                            href={`/practitioner/clients/${client.id}/messages`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant='ghost' size='icon' className='rounded-full p-2 hover:bg-gray-200/50'>
                              <MessageSquare className='h-5 w-5 text-gray-600' />
                            </Button>
                          </Link>
                          <Link
                            href={`/practitioner/clients/${client.id}/dashboard`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant='ghost' size='icon' className='rounded-full p-2 hover:bg-gray-200/50'>
                              <Eye className='h-5 w-5 text-gray-600' />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingInvitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/30 transition-colors'
                  >
                    <TableCell className='py-4 px-4 flex items-center gap-3'>
                      <Avatar className='h-9 w-9 rounded-full'>
                        <AvatarImage
                          src={getAvatarUrl(null, {
                            firstName: invitation.clientFirstName,
                            lastName: invitation.clientLastName,
                          })}
                        />
                        <AvatarFallback>{getInitials(getClientDisplayName(invitation))}</AvatarFallback>
                      </Avatar>
                      <span className='font-medium text-gray-800'>{getClientDisplayName(invitation)}</span>
                    </TableCell>
                    <TableCell className='py-4 px-4 text-gray-700'>-</TableCell>
                    <TableCell className='py-4 px-4'>
                      <span className='rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700'>
                        Invitation Pending
                      </span>
                    </TableCell>
                    <TableCell className='py-4 px-4 text-gray-700'>-</TableCell>
                    <TableCell className='py-4 px-4'>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => resendInvitation(invitation.id)}
                          disabled={isResending || isDeleting}
                          className='text-xs font-semibold text-gray-600 hover:bg-gray-200/50'
                        >
                          {isResending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                          Resend
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => deleteInvitation(invitation.id)}
                          disabled={isResending || isDeleting}
                          className='text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-100/50'
                        >
                          {isDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Pending Invitations Section (optional, can be moved below or removed) */}
    </div>
  );
}
