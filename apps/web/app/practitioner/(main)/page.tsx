'use client';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/tooltip';
import { Loader2, MessageSquare, Plus, Trash2, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useGetInvitations, useDeleteInvitation, useResendInvitation, InvitationResponse } from '@/lib/hooks/use-api';
import { useEffect } from 'react';

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
  const { mutate: deleteInvitation, isPending: isDeleting } = useDeleteInvitation();
  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();

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

  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    session?.error ||
    (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') ||
    isInvitationsLoading
  ) {
    return <LoadingSpinner />;
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');
  const joinedClients = invitations.filter((inv) => inv.status === 'JOINED');
  const totalClients = invitations.length;

  return (
    <>
      <header className='flex h-auto flex-col gap-4 border-b bg-background p-4 sm:h-auto sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl md:text-3xl'>
            Welcome Back{session?.user?.firstName ? ` Dr. ${session.user.firstName}` : ''}
          </h1>
        </div>
        <div className='flex justify-start sm:justify-end gap-2'>
          <Link href='/practitioner/invite'>
            <Button className='w-full sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' />
              Invite Client
            </Button>
          </Link>
        </div>
      </header>
      <div className='space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8'>
        <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
          <Card className='relative'>
            <Users className='absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-gray-100 sm:right-6 sm:h-20 sm:w-20' />
            <CardHeader className='pb-2 sm:pb-4'>
              <CardTitle className='text-base sm:text-lg'>Total Clients</CardTitle>
              <CardDescription className='text-sm'>All invited clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold sm:text-4xl'>{totalClients}</p>
            </CardContent>
          </Card>
          <Card className='relative'>
            <MessageSquare className='absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-gray-100 sm:right-6 sm:h-20 sm:w-20' />
            <CardHeader className='pb-2 sm:pb-4'>
              <CardTitle className='text-base sm:text-lg'>Active Clients</CardTitle>
              <CardDescription className='text-sm'>Successfully joined clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold sm:text-4xl'>{joinedClients.length}</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>You have {pendingInvitations.length} pending invitations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[200px] sm:w-[250px]'>Client Email</TableHead>
                      <TableHead className='hidden sm:table-cell'>Sent Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className='text-center h-24 text-muted-foreground'>
                          No pending invitations.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingInvitations.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0'>
                                <AvatarImage src={getAvatarUrl(client.avatar)} />
                                <AvatarFallback className='text-xs sm:text-sm'>
                                  {getInitials(client.clientEmail)}
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0 flex-1'>
                                <p className='font-medium text-sm sm:text-base truncate'>{client.clientEmail}</p>
                                <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                                  {getClientDisplayName(client)}
                                </p>
                                <p className='text-xs text-muted-foreground sm:hidden'>
                                  {new Date(client.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground hidden sm:table-cell'>
                            {new Date(client.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-1 sm:gap-2'>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        resendInvitation(client.id, {
                                          onSuccess: () => {
                                            toast.success('Invitation resent successfully.');
                                          },
                                          onError: (error: Error) => {
                                            toast.error(`Failed to resend invitation: ${error.message}`);
                                          },
                                        })
                                      }
                                      disabled={isResending}
                                      className='h-8 w-8 sm:h-9 sm:w-9 p-0'
                                    >
                                      {isResending ? (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                      ) : (
                                        <MessageSquare className='h-4 w-4' />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resend invitation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant='ghost' size='sm' className='h-8 w-8 sm:h-9 sm:w-9 p-0'>
                                          <Trash2 className='h-4 w-4' />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete invitation</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </AlertDialogTrigger>
                                <AlertDialogContent className='max-w-[95vw] mx-4'>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this invitation? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteInvitation(client.id, {
                                          onSuccess: () => {
                                            toast.success('Invitation deleted successfully.');
                                          },
                                          onError: (error: Error) => {
                                            toast.error(`Failed to delete invitation: ${error.message}`);
                                          },
                                        })
                                      }
                                      disabled={isDeleting}
                                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    >
                                      {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
