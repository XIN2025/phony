'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useRouter } from 'next/navigation';
import { useGetClients } from '@/lib/hooks/use-api';

const getActivityBadgeVariant = (clientStatus: string | undefined) => {
  switch (clientStatus) {
    case 'ACTIVE':
      return 'default';
    case 'INTAKE_COMPLETED':
      return 'secondary';
    case 'NEEDS_INTAKE':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getActivityLabel = (clientStatus: string | undefined, hasCompletedIntake: boolean) => {
  if (!clientStatus) return 'Invitation Pending';

  switch (clientStatus) {
    case 'ACTIVE':
      return 'High';
    case 'INTAKE_COMPLETED':
      return hasCompletedIntake ? 'Medium' : 'Low';
    case 'NEEDS_INTAKE':
      return 'Invitation Pending';
    default:
      return 'Low';
  }
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: clients = [], isLoading, error } = useGetClients();

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleClientRowClick = (clientId: string) => {
    router.push(`/practitioner/clients/${clientId}/dashboard`);
  };

  if (isLoading) {
    return (
      <>
        <header className='flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
          <div className='flex items-center gap-2'>
            <SidebarToggleButton />
            <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Clients</h1>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/practitioner/invite'>
              <Button className='whitespace-nowrap'>+ Invite Client</Button>
            </Link>
          </div>
        </header>
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className='flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
          <div className='flex items-center gap-2'>
            <SidebarToggleButton />
            <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Clients</h1>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/practitioner/invite'>
              <Button className='whitespace-nowrap'>+ Invite Client</Button>
            </Link>
          </div>
        </header>
        <div className='p-6'>
          <div className='text-center'>
            <p className='text-muted-foreground'>Failed to load clients. Please try again.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className='flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Clients</h1>
        </div>
        <div className='flex items-center gap-2'>
          <Link href='/practitioner/invite'>
            <Button className='whitespace-nowrap'>+ Invite Client</Button>
          </Link>
        </div>
      </header>

      <div className='p-4 sm:p-6 md:p-8'>
        <div className='mb-6'>
          <div className='relative w-full max-w-sm'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
              <Search className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
            </div>
            <Input
              placeholder='Search Clients'
              className='pl-10 sm:pl-12 w-full rounded-full border-input bg-background py-2 sm:py-3 text-sm'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className='w-full overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className='hidden sm:table-cell'>Email</TableHead>
                <TableHead className='hidden md:table-cell'>Phone</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className='hidden lg:table-cell'>Last Session</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className='cursor-pointer' onClick={() => handleClientRowClick(client.id)}>
                  <TableCell>
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <Avatar className='h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0'>
                        <AvatarImage
                          src={getAvatarUrl(client.avatarUrl, {
                            firstName: client.firstName,
                            lastName: client.lastName,
                          })}
                        />
                        <AvatarFallback className='text-xs sm:text-sm font-medium'>
                          {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm font-medium block truncate'>
                          {client.firstName} {client.lastName}
                        </span>
                        <span className='text-xs text-muted-foreground block truncate sm:hidden'>{client.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='hidden sm:table-cell'>
                    <span className='text-xs sm:text-sm text-muted-foreground'>{client.email}</span>
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <span className='text-xs sm:text-sm'>N/A</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActivityBadgeVariant(client.clientStatus)} className='text-xs px-2 py-1'>
                      {getActivityLabel(client.clientStatus, client.hasCompletedIntake) === 'Invitation Pending'
                        ? 'Pending'
                        : getActivityLabel(client.clientStatus, client.hasCompletedIntake)}
                    </Badge>
                  </TableCell>
                  <TableCell className='hidden lg:table-cell'>
                    <span className='text-xs sm:text-sm'>
                      {new Date(client.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1 sm:gap-2'>
                      <Link href={`/practitioner/clients/${client.id}/messages`} onClick={(e) => e.stopPropagation()}>
                        <Button variant='ghost' size='sm' className='p-1.5 sm:p-2 h-7 w-7 sm:h-8 sm:w-8'>
                          <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {filteredClients.length === 0 && (
          <div className='text-center py-8 sm:py-12'>
            <p className='text-muted-foreground mb-4 text-sm sm:text-base'>
              {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
            </p>
            {!searchTerm && (
              <Link href='/practitioner/invite'>
                <Button className='text-sm sm:text-base'>+ Invite Your First Client</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
