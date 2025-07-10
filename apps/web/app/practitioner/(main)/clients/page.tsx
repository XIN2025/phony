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
        <header className='flex flex-col gap-4 border-b bg-transparent p-6 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <SidebarToggleButton />
            <h1 className='text-2xl font-bold tracking-tight'>Clients</h1>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/practitioner/invite'>
              <Button className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'>
                + Invite Client
              </Button>
            </Link>
          </div>
        </header>
        <div className='flex items-center justify-center p-16'>
          <Loader2 className='h-8 w-8 animate-spin text-[#b7a9a3]' />
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
      <header className='flex flex-col gap-4 border-b bg-transparent p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <SidebarToggleButton />
          <h1 className='text-2xl font-bold tracking-tight'>Clients</h1>
        </div>
        <div className='flex items-center gap-2'>
          <Link href='/practitioner/invite'>
            <Button className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'>
              + Invite Client
            </Button>
          </Link>
        </div>
      </header>

      <div className='p-6 md:p-10 flex flex-col items-center min-h-[80vh]'>
        <div className='w-full max-w-[1450px]'>
          <div className='mb-8'>
            <div className='relative w-full max-w-md ml-0'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                <Search className='h-5 w-5 text-muted-foreground' />
              </div>
              <Input
                placeholder='Search Clients'
                className='pl-12 w-full rounded-full border border-[#E5D6D0] bg-white py-3 text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className='w-full bg-white rounded-3xl shadow-2xl border-0 p-0 overflow-hidden'>
            <div className='px-8 pt-8 pb-2'>
              <h2 className='text-lg font-bold mb-6'>Last Active Clients</h2>
              <Table>
                <TableHeader>
                  <TableRow className='[&>*]:py-4'>
                    <TableHead className='text-base font-semibold text-black'>Member</TableHead>
                    <TableHead className='hidden sm:table-cell text-base font-semibold text-black'>Email ID</TableHead>
                    <TableHead className='hidden md:table-cell text-base font-semibold text-black'>Phone</TableHead>
                    <TableHead className='text-base font-semibold text-black'>Plan Engagement</TableHead>
                    <TableHead className='hidden lg:table-cell text-base font-semibold text-black'>
                      Last Active
                    </TableHead>
                    <TableHead className='text-base font-semibold text-black'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className='group cursor-pointer hover:bg-[#F7F4F2] transition'
                      onClick={() => handleClientRowClick(client.id)}
                    >
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-9 w-9 flex-shrink-0 bg-[#E5D6D0]'>
                            <AvatarImage
                              src={getAvatarUrl(client.avatarUrl, {
                                firstName: client.firstName,
                                lastName: client.lastName,
                              })}
                            />
                            <AvatarFallback className='text-sm font-medium'>
                              {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 flex-1'>
                            <span className='text-base font-medium block truncate text-black'>
                              {client.firstName} {client.lastName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell py-4'>
                        <span className='text-base text-black'>{client.email}</span>
                      </TableCell>
                      <TableCell className='hidden md:table-cell py-4'>
                        <span className='text-base text-black'>N/A</span>
                      </TableCell>
                      <TableCell className='py-4'>
                        {(() => {
                          const label = getActivityLabel(client.clientStatus, client.hasCompletedIntake);
                          let badgeColor = 'bg-[#E5D6D0] text-black';
                          if (label === 'High') badgeColor = 'bg-[#C7E8D4] text-black';
                          if (label === 'Medium') badgeColor = 'bg-[#C7D7F8] text-black';
                          if (label === 'Low') badgeColor = 'bg-[#F8D7D7] text-black';
                          return (
                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className='hidden lg:table-cell py-4'>
                        <span className='text-base text-black'>
                          {new Date(client.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <Link
                            href={`/practitioner/clients/${client.id}/messages`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant='ghost' size='icon' className='rounded-full hover:bg-[#E5D6D0]'>
                              <MessageCircle className='h-5 w-5 text-[#b7a9a3] group-hover:text-black transition' />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredClients.length === 0 && (
              <div className='text-center py-16'>
                <p className='text-muted-foreground mb-6 text-lg'>
                  {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
                </p>
                {!searchTerm && (
                  <Link href='/practitioner/invite'>
                    <Button className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'>
                      + Invite Your First Client
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
