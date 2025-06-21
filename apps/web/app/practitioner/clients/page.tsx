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
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Clients</h1>
          <p className='text-muted-foreground'>Manage your clients and view pending invitations</p>
        </div>
        <Button onClick={() => router.push('/practitioner/invite')}>
          <Plus className='w-4 h-4 mr-2' />
          Invite Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            Active Clients
          </CardTitle>
          <CardDescription>Clients who have accepted your invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : clients && clients.length > 0 ? (
            <div className='space-y-4'>
              {clients.map((client) => (
                <div key={client.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div>
                    <h3 className='font-medium'>{client.name}</h3>
                    <p className='text-sm text-muted-foreground'>{client.email}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant={client.isActive ? 'default' : 'secondary'}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className='text-sm text-muted-foreground'>
                      Joined {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>No active clients yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Mail className='w-5 h-5' />
            Pending Invitations
          </CardTitle>
          <CardDescription>Invitations that have been sent but not yet accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
            </div>
          ) : invitations && invitations.filter((inv) => inv.status === 'pending').length > 0 ? (
            <div className='space-y-4'>
              {invitations
                .filter((invitation) => invitation.status === 'pending')
                .map((invitation) => (
                  <div key={invitation.id} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <h3 className='font-medium'>{invitation.clientEmail}</h3>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>Pending</Badge>
                      <span className='text-sm text-muted-foreground'>
                        Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={deleteInvitationMutation.isPending}
                            className='text-destructive hover:text-destructive'
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
            <div className='text-center py-8 text-muted-foreground'>No pending invitations.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
