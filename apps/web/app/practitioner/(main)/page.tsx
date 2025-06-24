'use client';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { ApiClient } from '@/lib/api-client';
import { getInitials } from '@/lib/utils';
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
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/tooltip';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, MessageCircle, MessageSquare, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
interface Client {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  status: 'PENDING' | 'JOINED';
  createdAt: string;
  avatar?: string;
}
const getClientDisplayName = (client: Client): string => {
  if (client.clientFirstName && client.clientLastName) {
    return `${client.clientFirstName} ${client.clientLastName}`;
  }
  return client.clientFirstName || client.clientLastName || client.clientEmail?.split('@')[0] || 'Client';
};
export default function PractitionerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ['invitations'],
    queryFn: async () => {
      return (await ApiClient.get('/api/practitioner/invitations')) as any[];
    },
    enabled: status === 'authenticated' && !!session?.user?.id,
  });
  const { mutate: deleteInvitation, isPending: isDeleting } = useMutation({
    mutationFn: (invitationId: string) => ApiClient.delete(`/api/practitioner/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete invitation: ${error.message}`);
    },
  });
  const { mutate: resendInvitation, isPending: isResending } = useMutation({
    mutationFn: (invitationId: string) => ApiClient.post(`/api/practitioner/invitations/${invitationId}/resend`),
    onSuccess: () => {
      toast.success('Invitation resent successfully.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(`Failed to resend invitation: ${error.message}`);
    },
  });

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/practitioner/auth');
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (session?.error) {
    router.push('/practitioner/auth');
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'PRACTITIONER') {
    if (session?.user?.role === 'CLIENT') {
      router.push('/client');
    } else {
      router.push('/practitioner/auth');
    }
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isClientsLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }
  const joinedClients = clients.filter((c) => c.status === 'JOINED');
  const pendingClients = clients.filter((c) => c.status === 'PENDING');
  return (
    <>
      <header className='flex h-auto flex-col gap-4 border-b bg-background p-4 sm:h-auto sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl md:text-3xl'>
            Welcome Back{session?.user?.firstName ? ` Dr. ${session.user.firstName}` : ''}
          </h1>
        </div>
        <div className='flex justify-start sm:justify-end'>
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
              <p className='text-3xl font-bold sm:text-4xl'>{clients.length}</p>
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
              <CardDescription>You have {pendingClients.length} pending invitations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[200px] sm:w-[250px]'>Client Email</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className='text-center h-24 text-muted-foreground'>
                          No pending invitations.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8 sm:h-9 sm:w-9'>
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback className='text-xs sm:text-sm'>
                                  {getInitials(client.clientEmail)}
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0 flex-1'>
                                <p className='font-medium text-sm sm:text-base truncate'>{client.clientEmail}</p>
                                <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                                  {client.clientFirstName && client.clientLastName
                                    ? `${client.clientFirstName} ${client.clientLastName}`
                                    : 'Name not provided'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm'>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end gap-1 sm:gap-2'>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-8 w-8'
                                      onClick={() => resendInvitation(client.id)}
                                      disabled={isResending}
                                    >
                                      {isResending ? (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                      ) : (
                                        <RefreshCw className='h-4 w-4' />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resend invitation</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant='ghost'
                                          size='icon'
                                          className='h-8 w-8 text-destructive hover:text-destructive'
                                          disabled={isDeleting}
                                        >
                                          {isDeleting ? (
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                          ) : (
                                            <Trash2 className='h-4 w-4' />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this invitation? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteInvitation(client.id)}
                                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete invitation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
        {joinedClients.length > 0 && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Active Clients</CardTitle>
                <CardDescription>You have {joinedClients.length} active clients.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[200px] sm:w-[250px]'>Client</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {joinedClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8 sm:h-9 sm:w-9'>
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback className='text-xs sm:text-sm'>
                                  {getInitials(getClientDisplayName(client))}
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0 flex-1'>
                                <p className='font-medium text-sm sm:text-base truncate'>
                                  {getClientDisplayName(client)}
                                </p>
                                <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                                  {client.clientEmail}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm'>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant='default' className='font-normal'>
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end gap-1 sm:gap-2'>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                                      <MessageCircle className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Send message</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                                      <Eye className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View profile</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
