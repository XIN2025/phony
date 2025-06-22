'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { Plus, Trash2, Eye, MessageSquare } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/components/skeleton';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';

interface Client {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  clientEmail: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

type ClientOrInvitation = (Client & { type: 'client' }) | (Invitation & { type: 'invitation' });

const getInitials = (name?: string | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]?.[0] ?? ''}${names[names.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => ApiClient.get('/api/practitioner/clients'),
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['invitations'],
    queryFn: () => ApiClient.get('/api/practitioner/invitations'),
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => ApiClient.delete(`/api/practitioner/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete invitation.';
      toast.error(errorMessage);
    },
  });

  const isLoading = clientsLoading || invitationsLoading;

  const combinedData: ClientOrInvitation[] = [
    ...((clients as Client[]) || []).map((c) => ({ ...c, type: 'client' as const })),
    ...((invitations?.filter((inv) => inv.status === 'pending') as Invitation[]) || []).map((inv) => ({
      ...inv,
      type: 'invitation' as const,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteInvitation = (invitationId: string) => {
    deleteInvitationMutation.mutate(invitationId);
  };

  return (
    <div className='flex flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold text-gray-800'>Clients</h1>
          <p className='text-muted-foreground'>Manage your clients and view pending invitations.</p>
        </div>
        <Button
          onClick={() => router.push('/practitioner/invite')}
          className='bg-gray-900 text-white hover:bg-gray-800'
        >
          <Plus className='mr-2 h-4 w-4' /> Invite Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <div className='min-w-[800px]'>
              <div className='grid grid-cols-12 gap-4 border-b pb-4 text-sm font-medium text-muted-foreground'>
                <div className='col-span-4'>Client</div>
                <div className='col-span-3'>Date Added</div>
                <div className='col-span-2'>Status</div>
                <div className='col-span-3 text-right'>Actions</div>
              </div>

              <div className='flex flex-col'>
                {isLoading ? (
                  <>
                    <Skeleton className='h-16 w-full border-b' />
                    <Skeleton className='h-16 w-full border-b' />
                    <Skeleton className='h-16 w-full border-b' />
                  </>
                ) : combinedData.length > 0 ? (
                  combinedData.map((item) => {
                    if (item.type === 'client') {
                      return (
                        <div
                          key={item.id}
                          className='grid grid-cols-12 items-center gap-4 border-b py-4 transition-colors hover:bg-gray-50'
                        >
                          <div className='col-span-4'>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-10 w-10'>
                                <AvatarFallback className='bg-gray-200 text-gray-600'>
                                  {getInitials(item.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className='font-medium text-gray-800'>{item.name}</p>
                                <p className='text-sm text-muted-foreground'>{item.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className='col-span-3 text-muted-foreground'>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          <div className='col-span-2'>
                            <Badge
                              variant={item.isActive ? 'default' : 'secondary'}
                              className='rounded-full px-3 py-1 font-normal capitalize'
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className='col-span-3 flex items-center justify-end gap-2'>
                            <Button variant='ghost' size='icon' aria-label='Message Client'>
                              <MessageSquare className='h-5 w-5' />
                            </Button>
                            <Button variant='ghost' size='icon' aria-label='View Client Details'>
                              <Eye className='h-5 w-5' />
                            </Button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={item.id}
                          className='grid grid-cols-12 items-center gap-4 border-b py-4 transition-colors hover:bg-gray-50'
                        >
                          <div className='col-span-4'>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-10 w-10'>
                                <AvatarFallback className='bg-gray-200 text-gray-600'>
                                  {getInitials(item.clientEmail)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className='font-medium text-gray-800'>{item.clientEmail}</p>
                                <p className='text-sm text-muted-foreground'>Invitation sent</p>
                              </div>
                            </div>
                          </div>
                          <div className='col-span-3 text-muted-foreground'>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          <div className='col-span-2'>
                            <Badge variant='outline' className='rounded-full px-3 py-1 font-normal capitalize'>
                              Pending
                            </Badge>
                          </div>
                          <div className='col-span-3 flex items-center justify-end gap-2'>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                                  disabled={deleteInvitationMutation.isPending}
                                  aria-label='Delete Invitation'
                                >
                                  <Trash2 className='h-5 w-5' />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the invitation sent to {item.clientEmail}? This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvitation(item.id)}
                                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className='col-span-12 py-10 text-center text-muted-foreground'>
                    You have no clients or pending invitations.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
