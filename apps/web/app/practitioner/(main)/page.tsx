'use client';
import {
  InvitationResponse,
  useCleanupExpiredInvitations,
  useDeleteInvitation,
  useGetInvitations,
  useResendInvitation,
  useGetClientsWithLastSession,
  useUnreadMessagesCount,
} from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Eye, Loader2, MessageSquare, Users, BookText, Repeat, Trash2, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/tooltip';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { useUnreadJournalCount } from '@/lib/hooks/use-unread-journals';
import { toast } from 'sonner';

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
  const { data: clients = [] } = useGetClientsWithLastSession();

  const { mutate: deleteInvitation, isPending: isDeleting } = useDeleteInvitation();
  const resendInvitationMutation = useResendInvitation();
  const { mutate: cleanupExpiredInvitations, isPending: isCleaningUp } = useCleanupExpiredInvitations();
  const { count: unreadMessages, isLoading: isUnreadLoading } = useUnreadMessagesCount();
  const { data: unreadJournals = 0, isLoading: isUnreadJournalsLoading } = useUnreadJournalCount();

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

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');
  const joinedClients = invitations.filter((inv) => inv.status === 'JOINED');
  const totalClients = invitations.length;

  const getPlanEngagement = (client: any) => {
    if (!client.clientStatus || client.clientStatus === 'NEEDS_INTAKE') {
      return 'Invitation Pending';
    }

    if (!client.hasCompletedIntake) {
      return 'Low';
    }

    return 'Low';
  };
  const getPlanBadgeColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-[#F8D7D7] text-black';
      case 'Invitation Pending':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-[#E5D6D0] text-black';
    }
  };
  const getLastSession = (client: any) => {
    if (client.lastSession) {
      return new Date(client.lastSession).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return <span className='text-gray-500 italic'>Nil</span>;
  };

  const getLastActive = (client: any) => {
    if (client.lastSession) {
      return new Date(client.lastSession).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return <span className='text-gray-500 italic'>Nil</span>;
  };

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
    <div className='flex flex-col w-full pt-2 sm:pt-5 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <h1
            className='font-semibold mb-2 sm:mb-0 truncate text-xl sm:text-2xl lg:text-[26px] xl:text-[32px]'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Welcome Back{user?.firstName ? ` Dr. ${user.firstName}` : ''}
          </h1>
        </div>
        <Button
          className='rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium bg-[#807171] text-white hover:bg-gray-800 shadow-sm w-full sm:w-auto'
          asChild
        >
          <Link href='/practitioner/invite'>
            <Plus className='h-4 w-4 mr-2' />
            Invite Client
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 w-full'>
        <Card
          className='relative pt-4 sm:pt-6 lg:pt-4 pb-4 sm:pb-6 lg:pb-4 px-4 sm:px-6 lg:px-4 rounded-xl sm:rounded-2xl border-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)] hover:bg-gray-50/60 transition-colors overflow-hidden'
          style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.6)', border: 'none' }}
        >
          <div className='flex flex-col min-w-0 pl-3 relative z-10'>
            <span className='text-[14px] sm:text-[16px] font-medium  mb-1 sm:mb-2'>Total Clients</span>
            <span className='text-[24px] sm:text-[28px] lg:text-[32px] 2xl:text-[36px] font-bold text-gray-900'>
              {totalClients}
            </span>
            {/* <span className='text-[12px] mt-1'>+2 from last month</span> */}
          </div>
          <div className='absolute -bottom-2 sm:-bottom-4 lg:-bottom-6 -right-2 sm:-right-4 lg:-right-6 opacity-60'>
            <Users className='h-24 w-24 sm:h-30 sm:w-30 lg:h-34 lg:w-34 text-[#807171] stroke-[0.5]' />
          </div>
        </Card>
        <Card
          className='relative pt-4 sm:pt-6 lg:pt-4 pb-4 sm:pb-6 lg:pb-4 px-4 sm:px-6 lg:px-4 rounded-xl sm:rounded-2xl border-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)] hover:bg-gray-50/60 transition-colors overflow-hidden'
          style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.6)', border: 'none' }}
        >
          <div className='flex flex-col min-w-0 pl-3 relative z-10'>
            <span className='text-[14px] sm:text-[16px] font-medium  mb-1 sm:mb-2'>Unread Messages</span>
            <span className='text-[24px] sm:text-[28px] lg:text-[32px] 2xl:text-[36px] font-bold text-gray-900'>
              {isUnreadLoading ? (
                <Loader2 className='inline h-4 w-4 sm:h-6 sm:w-6 animate-spin text-muted-foreground' />
              ) : (
                unreadMessages
              )}
            </span>
            <span className='text-xs text-gray-700 mt-1'>&nbsp;</span>
          </div>
          <div className='absolute -bottom-2 sm:-bottom-4 lg:-bottom-6 -right-2 sm:-right-4 lg:-right-6 opacity-60'>
            <Image
              src='/home/sms-tracking.svg'
              alt='SMS Tracking'
              width={160}
              height={133}
              className='h-24 w-24 sm:h-30 sm:w-30 lg:h-34 lg:w-34'
            />
          </div>
        </Card>
        <Card
          className='relative pt-4 sm:pt-6 lg:pt-4 pb-4 sm:pb-6 lg:pb-4 px-4 sm:px-6 lg:px-4 rounded-xl sm:rounded-2xl border-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)] hover:bg-gray-50/60 transition-colors overflow-hidden sm:col-span-2 lg:col-span-1'
          style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.6)', border: 'none' }}
        >
          <div className='flex flex-col min-w-0 pl-3 relative z-10'>
            <span className='text-[14px] sm:text-[16px] font-medium  mb-1 sm:mb-2'>Unread Journals</span>
            <span className='text-[24px] sm:text-[28px] lg:text-[32px] 2xl:text-[36px] font-bold text-gray-900'>
              {isUnreadJournalsLoading ? (
                <Loader2 className='inline h-4 w-4 sm:h-6 sm:w-6 animate-spin text-muted-foreground' />
              ) : (
                unreadJournals
              )}
            </span>
            <span className='text-xs text-gray-500 mt-1'>&nbsp;</span>
          </div>
          <div className='absolute -bottom-2 sm:-bottom-4 lg:-bottom-6 -right-3 sm:-right-6 lg:-right-8 opacity-60'>
            <Image
              src='/home/book.svg'
              alt='Book'
              width={84}
              height={80}
              className='h-24 w-24 sm:h-30 sm:w-30 lg:h-34 lg:w-34 text-[#807171] stroke-[0.5]'
            />
          </div>
        </Card>
      </div>
      <Card
        className='rounded-xl sm:rounded-2xl border-0 w-full min-w-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)]'
        style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.6)', border: 'none' }}
      >
        <CardContent className='p-0 sm:p-4 lg:p-6 !pt-0 !pb-0'>
          <h2
            className=' lg:text-[20px] xl:text-[24px] text-base px-1 font-semibold mb-2 sm:mb-4 lg:mb-6  sm:text-xl  '
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Last Active Clients
          </h2>
          <div className='overflow-x-auto'>
            <div className='min-w-full inline-block align-middle'>
              <div className='overflow-hidden rounded-lg'>
                <Table className='min-w-[700px] w-full text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                  <colgroup>
                    <col className='w-[32%] min-w-[120px]' />
                    <col className='w-[22%] min-w-[90px]' />
                    <col className='w-[26%] min-w-[90px]' />
                    <col className='w-[20%] min-w-[80px]' />
                  </colgroup>
                  <TableHeader>
                    <TableRow className='border-b border-gray-200/60 bg-gray-50/50'>
                      <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px]  truncate'>
                        Member
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] '>
                        Last Session
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px]  truncate'>
                        Plan Engagement
                      </TableHead>
                      <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-center font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px]  truncate'>
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
                          className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/50 transition-colors h-[26px] cursor-pointer'
                          onClick={() => router.push(`/practitioner/clients/${client.id}/dashboard`)}
                        >
                          <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 truncate'>
                            <Avatar className='h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full flex-shrink-0'>
                              <AvatarImage
                                src={getAvatarUrl(client.avatarUrl, {
                                  firstName: client.firstName,
                                  lastName: client.lastName,
                                })}
                              />
                              <AvatarFallback className='text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                                {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px] truncate'>
                              {client.firstName} {client.lastName}
                            </span>
                          </TableCell>
                          <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                            {getLastSession(client)}
                          </TableCell>
                          <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6'>
                            <span
                              className={`rounded-full px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 text-[12px] sm:text-[14px] font-semibold whitespace-nowrap inline-block ${getPlanBadgeColor(planLevel)}`}
                            >
                              {planLevel}
                            </span>
                          </TableCell>
                          <TableCell
                            className='py-1.5 px-2 sm:px-4 lg:px-6 text-center align-middle truncate'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className='flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 min-h-[20px] sm:min-h-[24px] lg:min-h-[26px]'>
                              <Link
                                href={`/practitioner/clients/${client.id}/messages`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-gray-200/50 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 flex items-center justify-center'
                                >
                                  <MessageSquare className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-600' />
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
                        className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/50 transition-colors h-[26px]'
                      >
                        <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0'>
                          <Avatar className='h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full flex-shrink-0'>
                            <AvatarImage
                              src={getAvatarUrl(null, {
                                firstName: invitation.clientFirstName,
                                lastName: invitation.clientLastName,
                              })}
                            />
                            <AvatarFallback className='text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                              {getInitials(getClientDisplayName(invitation))}
                            </AvatarFallback>
                          </Avatar>
                          <span className='font-medium text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px] truncate'>
                            {getClientDisplayName(invitation)}
                          </span>
                        </TableCell>
                        <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                          -
                        </TableCell>
                        <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6'>
                          <span className='rounded-full px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 text-[12px] sm:text-[14px] font-semibold bg-gray-100 text-gray-700 block'>
                            Invitation Pending
                          </span>
                        </TableCell>
                        <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-center align-middle'>
                          <div className='flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 min-h-[20px] sm:min-h-[24px] lg:min-h-[26px]'>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-gray-200/50 focus:outline-none flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7'
                                    onClick={() => {
                                      resendInvitationMutation.mutate(invitation.id, {
                                        onSuccess: () => {
                                          toast.success('Invitation resent successfully');
                                        },
                                        onError: () => {
                                          toast.error('Failed to resend invitation');
                                        },
                                      });
                                    }}
                                    disabled={resendInvitationMutation.isPending || isDeleting}
                                    aria-label='Resend Invitation'
                                  >
                                    {resendInvitationMutation.isPending ? (
                                      <Loader2 className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 animate-spin text-gray-600' />
                                    ) : (
                                      <Repeat className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-blue-600' />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side='top'>Resend</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-red-100 focus:outline-none flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7'
                                    onClick={() => deleteInvitation(invitation.id)}
                                    disabled={resendInvitationMutation.isPending || isDeleting}
                                    aria-label='Delete Invitation'
                                  >
                                    {isDeleting ? (
                                      <Loader2 className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 animate-spin text-red-600' />
                                    ) : (
                                      <Trash2 className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-red-600' />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side='top'>Delete</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
    </div>
  );
}
