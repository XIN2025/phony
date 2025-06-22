'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { Users, Mail, Plus, Trash2 } from 'lucide-react';
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

  const handleDeleteInvitation = (invitationId: string) => {
    deleteInvitationMutation.mutate(invitationId);
  };

  return (
    <div className='container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div className='space-y-1 sm:space-y-2'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Clients</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage your clients and view pending invitations</p>
        </div>
        <Button onClick={() => router.push('/practitioner/invite')} className='w-full sm:w-auto'>
          <Plus className='w-4 h-4 mr-2' />
          Invite Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
            <Users className='w-4 h-4 sm:w-5 sm:h-5' />
            Active Clients
          </CardTitle>
          <CardDescription className='text-sm'>Clients who have accepted your invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : clients && clients.length > 0 ? (
            <div className='space-y-3 sm:space-y-4'>
              {clients.map((client) => (
                <div
                  key={client.id}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2 sm:gap-0'
                >
                  <div className='space-y-1'>
                    <h3 className='font-medium text-sm sm:text-base'>{client.name}</h3>
                    <p className='text-xs sm:text-sm text-muted-foreground'>{client.email}</p>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                    <Badge variant={client.isActive ? 'default' : 'secondary'} className='w-fit'>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className='text-xs sm:text-sm text-muted-foreground'>
                      Joined {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground text-sm sm:text-base'>No active clients yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
            <Mail className='w-4 h-4 sm:w-5 sm:h-5' />
            Pending Invitations
          </CardTitle>
          <CardDescription className='text-sm'>Invitations that have been sent but not yet accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
            </div>
          ) : invitations && invitations.filter((inv) => inv.status === 'pending').length > 0 ? (
            <div className='space-y-3 sm:space-y-4'>
              {invitations
                .filter((invitation) => invitation.status === 'pending')
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2 sm:gap-0'
                  >
                    <div className='space-y-1'>
                      <h3 className='font-medium text-sm sm:text-base'>{invitation.clientEmail}</h3>
                    </div>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                      <Badge variant='outline' className='w-fit'>
                        Pending
                      </Badge>
                      <span className='text-xs sm:text-sm text-muted-foreground'>
                        Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={deleteInvitationMutation.isPending}
                            className='text-destructive hover:text-destructive w-fit'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the invitation sent to {invitation.clientEmail}? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground text-sm sm:text-base'>No pending invitations.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
