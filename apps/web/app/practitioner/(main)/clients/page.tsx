'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Input } from '@repo/ui/components/input';
import { Search, Plus, MessageCircle } from 'lucide-react';
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

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { data: clients = [], isLoading, isError } = useGetClients();

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
          <Link href='/practitioner/invite'>
            <Button className='whitespace-nowrap'>
              <Plus className='mr-2 h-4 w-4' />
              Invite Client
            </Button>
          </Link>
        </div>
      </header>
      <div className='p-4 sm:p-6 md:p-8'>
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Intake Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    renderSkeleton()
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center text-destructive py-8'>
                        Failed to load clients. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center text-muted-foreground py-8'>
                        No clients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className='cursor-pointer hover:bg-accent focus:bg-accent outline-none'
                        tabIndex={0}
                        onClick={() => router.push(`/practitioner/clients/${client.id}/dashboard`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            router.push(`/practitioner/clients/${client.id}/dashboard`);
                          }
                        }}
                      >
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src={getAvatarUrl(client.avatarUrl)} />
                              <AvatarFallback>{getInitials(getClientDisplayName(client))}</AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{getClientDisplayName(client)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>
                          <Badge variant='outline' className='border-green-200 bg-green-50 text-green-700'>
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.hasCompletedIntake ? (
                            <Badge className='bg-green-100 text-green-800 hover:bg-green-200'>Completed</Badge>
                          ) : (
                            <Badge variant='outline' className='border-yellow-200 bg-yellow-50 text-yellow-700'>
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button variant='ghost' size='icon'>
                              <MessageCircle className='h-4 w-4' />
                            </Button>
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
    </>
  );
}
