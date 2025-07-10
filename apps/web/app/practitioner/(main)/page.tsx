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
    <div className='flex flex-col w-full pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'>
            Welcome Back{user?.firstName ? ` Dr. ${user.firstName}` : ''}
          </h1>
        </div>
        <Button
          className='rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium bg-black text-white hover:bg-gray-800 shadow-sm w-full sm:w-auto'
          asChild
        >
          <Link href='/practitioner/invite'>+ Invite Client</Link>
        </Button>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 w-full'>
        <Card className='flex flex-col justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs sm:text-sm font-medium text-gray-600'>Total Clients</span>
              <span className='text-2xl sm:text-3xl lg:text-4xl font-bold'>{totalClients}</span>
              <span className='text-xs text-green-600 mt-1'>+2 from last month</span>
            </div>
            <div className='p-2 sm:p-3 bg-gray-200/50 rounded-full flex-shrink-0 ml-2'>
              <Users className='h-4 w-4 sm:h-6 sm:w-6 text-gray-700' />
            </div>
          </div>
        </Card>
        <Card className='flex flex-col justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs sm:text-sm font-medium text-gray-600'>Unread Messages</span>
              <span className='text-2xl sm:text-3xl lg:text-4xl font-bold'>{unreadMessages}</span>
              <span className='text-xs text-transparent mt-1'>&nbsp;</span>
            </div>
            <div className='p-2 sm:p-3 bg-gray-200/50 rounded-full flex-shrink-0 ml-2'>
              <Inbox className='h-4 w-4 sm:h-6 sm:w-6 text-gray-700' />
            </div>
          </div>
        </Card>
        <Card className='flex flex-col justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 sm:col-span-2 lg:col-span-1'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs sm:text-sm font-medium text-gray-600'>Unread Journals</span>
              <span className='text-2xl sm:text-3xl lg:text-4xl font-bold'>{unreadJournals}</span>
              <span className='text-xs text-transparent mt-1'>&nbsp;</span>
            </div>
            <div className='p-2 sm:p-3 bg-gray-200/50 rounded-full flex-shrink-0 ml-2'>
              <BookText className='h-4 w-4 sm:h-6 sm:w-6 text-gray-700' />
            </div>
          </div>
        </Card>
      </div>
      <Card className='rounded-2xl shadow-xl border-white/50 border bg-white/60 backdrop-blur-sm w-full min-w-0'>
        <CardContent className='p-4 sm:p-6'>
          <h2 className='text-lg sm:text-xl font-semibold mb-4'>Last Active Clients</h2>
          <div className='overflow-x-auto -mx-4 sm:-mx-6'>
            <div className='min-w-full inline-block align-middle'>
              <div className='overflow-hidden'>
                <Table className='min-w-full text-sm'>
                  <TableHeader>
                    <TableRow className='border-b border-gray-200/60'>
                      <TableHead className='py-3 px-2 sm:px-4 text-left font-semibold text-gray-600 text-xs sm:text-sm'>
                        Member
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 text-left font-semibold text-gray-600 text-xs sm:text-sm hidden sm:table-cell'>
                        Last Session
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 text-left font-semibold text-gray-600 text-xs sm:text-sm'>
                        Plan Engagement
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 text-left font-semibold text-gray-600 text-xs sm:text-sm hidden lg:table-cell'>
                        Last Active
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 text-left font-semibold text-gray-600 text-xs sm:text-sm'>
                        Actions
                      </TableHead>
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
                          <TableCell className='py-3 sm:py-4 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 min-w-0'>
                            <Avatar className='h-7 w-7 sm:h-9 sm:w-9 rounded-full flex-shrink-0'>
                              <AvatarImage
                                src={getAvatarUrl(client.avatarUrl, {
                                  firstName: client.firstName,
                                  lastName: client.lastName,
                                })}
                              />
                              <AvatarFallback className='text-xs sm:text-sm'>
                                {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium text-gray-800 text-xs sm:text-sm truncate'>
                              {client.firstName} {client.lastName}
                            </span>
                          </TableCell>
                          <TableCell className='py-3 sm:py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden sm:table-cell'>
                            {getLastSession(client)}
                          </TableCell>
                          <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                            <span
                              className={`rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold ${getPlanBadgeColor(
                                planLevel || '',
                              )}`}
                            >
                              {planLevel}
                            </span>
                          </TableCell>
                          <TableCell className='py-3 sm:py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden lg:table-cell'>
                            {getLastActive(client)}
                          </TableCell>
                          <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                            <div className='flex gap-1 sm:gap-2'>
                              <Link
                                href={`/practitioner/clients/${client.id}/messages`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='rounded-full p-1 sm:p-2 hover:bg-gray-200/50 h-8 w-8 sm:h-10 sm:w-10'
                                >
                                  <MessageSquare className='h-4 w-4 sm:h-5 sm:w-5 text-gray-600' />
                                </Button>
                              </Link>
                              <Link
                                href={`/practitioner/clients/${client.id}/dashboard`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='rounded-full p-1 sm:p-2 hover:bg-gray-200/50 h-8 w-8 sm:h-10 sm:w-10'
                                >
                                  <Eye className='h-4 w-4 sm:h-5 sm:w-5 text-gray-600' />
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
                        <TableCell className='py-3 sm:py-4 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 min-w-0'>
                          <Avatar className='h-7 w-7 sm:h-9 sm:w-9 rounded-full flex-shrink-0'>
                            <AvatarImage
                              src={getAvatarUrl(null, {
                                firstName: invitation.clientFirstName,
                                lastName: invitation.clientLastName,
                              })}
                            />
                            <AvatarFallback className='text-xs sm:text-sm'>
                              {getInitials(getClientDisplayName(invitation))}
                            </AvatarFallback>
                          </Avatar>
                          <span className='font-medium text-gray-800 text-xs sm:text-sm truncate'>
                            {getClientDisplayName(invitation)}
                          </span>
                        </TableCell>
                        <TableCell className='py-3 sm:py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden sm:table-cell'>
                          -
                        </TableCell>
                        <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                          <span className='rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold bg-gray-100 text-gray-700'>
                            Invitation Pending
                          </span>
                        </TableCell>
                        <TableCell className='py-3 sm:py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden lg:table-cell'>
                          -
                        </TableCell>
                        <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                          <div className='flex gap-1 sm:gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => resendInvitation(invitation.id)}
                              disabled={isResending || isDeleting}
                              className='text-xs font-semibold text-gray-600 hover:bg-gray-200/50 h-8 px-2 sm:h-9 sm:px-3'
                            >
                              {isResending ? (
                                <Loader2 className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin' />
                              ) : null}
                              Resend
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => deleteInvitation(invitation.id)}
                              disabled={isResending || isDeleting}
                              className='text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-100/50 h-8 px-2 sm:h-9 sm:px-3'
                            >
                              {isDeleting ? (
                                <Loader2 className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin' />
                              ) : null}
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Pending Invitations Section (optional, can be moved below or removed) */}
    </div>
  );
}
