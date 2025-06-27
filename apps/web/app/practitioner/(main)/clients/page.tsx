'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Input } from '@repo/ui/components/input';
import { Search, Plus, MessageCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@repo/ui/components/skeleton';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useGetClients, Client } from '@/lib/hooks/use-api';
import { useRouter } from 'next/navigation';

const getClientDisplayName = (client: Client): string => {
  if (client.firstName && client.lastName) {
    return `${client.firstName} ${client.lastName}`;
  }
  return client.firstName || client.lastName || client.email?.split('@')[0] || 'Client';
};

const getClientStatus = (
  client: Client,
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (!client.hasCompletedIntake) {
    return { label: 'Pending Intake', variant: 'destructive' };
  }

  switch (client.clientStatus) {
    case 'ACTIVE':
      return { label: 'Active', variant: 'default' };
    case 'NEEDS_INTAKE':
      return { label: 'Needs Intake', variant: 'destructive' };
    case 'COMPLETED_INTAKE':
      return { label: 'Ready', variant: 'secondary' };
    default:
      return { label: 'Unknown', variant: 'outline' };
  }
};

const renderSkeleton = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <Skeleton className='h-4 w-32' />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-40' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-24' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-6 w-20 rounded-full' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-24' />
        </TableCell>
        <TableCell className='text-right'>
          <div className='flex justify-end gap-2'>
            <Skeleton className='h-8 w-8 rounded-md' />
            <Skeleton className='h-8 w-8 rounded-md' />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

const ClientsTable = ({ clients, searchTerm }: { clients: Client[]; searchTerm: string }) => {
  const filteredClients = clients.filter(
    (client) =>
      getClientDisplayName(client).toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (filteredClients.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <p className='text-muted-foreground text-center'>
            {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
          </p>
          {!searchTerm && (
            <Link href='/practitioner/invite'>
              <Button className='mt-4'>
                <Plus className='h-4 w-4 mr-2' />
                Invite Your First Client
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => {
            const status = getClientStatus(client);
            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={getAvatarUrl(client.avatarUrl)} />
                      <AvatarFallback className='text-xs'>{getInitials(getClientDisplayName(client))}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{getClientDisplayName(client)}</p>
                      <p className='text-sm text-muted-foreground'>{client.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <p className='text-sm'>{new Date(client.createdAt).toLocaleDateString()}</p>
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Link href={`/practitioner/clients/${client.id}/messages`}>
                      <Button variant='outline' size='sm' className='flex items-center gap-2'>
                        <MessageCircle className='h-4 w-4' />
                        Message
                      </Button>
                    </Link>
                    <Link href={`/practitioner/clients/${client.id}/dashboard`}>
                      <Button variant='outline' size='sm'>
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { data: clients = [], isLoading, isError, refetch, isFetching } = useGetClients();

  const filteredClients = clients.filter(
    (client) =>
      getClientDisplayName(client).toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <header className='flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Clients</h1>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative w-full max-w-xs'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='h-5 w-5 text-muted-foreground' />
            </div>
            <Input
              placeholder='Search Clients'
              className='pl-10 w-full'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching} className='flex items-center gap-2'>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href='/practitioner/invite'>
            <Button className='whitespace-nowrap'>
              <Plus className='mr-2 h-4 w-4' />
              Invite Client
            </Button>
          </Link>
        </div>
      </header>
      <div className='p-4 sm:p-6 md:p-8'>
        {isLoading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderSkeleton()}</TableBody>
            </Table>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className='text-center text-destructive py-8'>
              Failed to load clients. Please try again.
            </CardContent>
          </Card>
        ) : (
          <ClientsTable clients={clients} searchTerm={searchTerm} />
        )}
      </div>
    </>
  );
}
