'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Search, MessageCircle, Loader2, Repeat, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/tooltip';
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
            <h1 className='text-2xl font-bold tracking-tight' style={{ fontFamily: "'Playfair Display', serif" }}>
              Clients
            </h1>
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
            <h1
              className='text-xl font-bold tracking-tight sm:text-2xl'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Clients
            </h1>
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
      <header className='flex flex-row items-center justify-between gap-3 sm:gap-4 border-b bg-transparent p-4 sm:p-6 min-w-0'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1
            className='text-xl sm:text-2xl font-bold tracking-tight truncate'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Clients
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          <Link href='/practitioner/invite'>
            <Button className='bg-black text-white rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-md hover:bg-neutral-800 transition-all w-full sm:w-auto'>
              + Invite Client
            </Button>
          </Link>
        </div>
      </header>

      <div className='p-4 sm:p-6 lg:p-10 flex flex-col items-center min-h-[80vh] min-w-0'>
        <div className='w-full max-w-[1450px] min-w-0'>
          <div className='mb-6 sm:mb-8'>
            <div className='relative w-full max-w-md ml-0'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4'>
                <Search className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
              </div>
              <Input
                placeholder='Search Clients'
                className='pl-10 sm:pl-12 w-full rounded-full border border-[#E5D6D0] bg-white py-2 sm:py-3 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className='w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-0 p-0 overflow-hidden min-w-0'>
            <div className='px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-2'>
              <h2
                className='text-base sm:text-lg font-bold mb-4 sm:mb-6'
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Last Active Clients
              </h2>
              <div className='overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8'>
                <div className='min-w-full inline-block align-middle'>
                  <div className='overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow className='[&>*]:py-3 sm:[&>*]:py-4'>
                          <TableHead className='text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Member
                          </TableHead>
                          <TableHead className='hidden sm:table-cell text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Email ID
                          </TableHead>
                          <TableHead className='hidden md:table-cell text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Phone
                          </TableHead>
                          <TableHead className='text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Plan Engagement
                          </TableHead>
                          <TableHead className='hidden lg:table-cell text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Last Active
                          </TableHead>
                          <TableHead className='text-sm sm:text-base font-semibold text-black px-2 sm:px-4'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow
                            key={client.id}
                            className='group cursor-pointer hover:bg-[#F7F4F2] transition'
                            onClick={() => handleClientRowClick(client.id)}
                          >
                            <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                              <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
                                <Avatar className='h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0 bg-[#E5D6D0]'>
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
                                  <span className='text-sm sm:text-base font-medium block truncate text-black'>
                                    {client.firstName} {client.lastName}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-4'>
                              <span className='text-sm sm:text-base text-black truncate block'>{client.email}</span>
                            </TableCell>
                            <TableCell className='hidden md:table-cell py-3 sm:py-4 px-2 sm:px-4'>
                              <span className='text-sm sm:text-base text-black'>{client.phoneNumber || '-'}</span>
                            </TableCell>
                            <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                              {(() => {
                                const label = getActivityLabel(client.clientStatus, client.hasCompletedIntake);
                                let badgeColor = 'bg-[#E5D6D0] text-black';
                                if (label === 'High') badgeColor = 'bg-[#C7E8D4] text-black';
                                if (label === 'Medium') badgeColor = 'bg-[#C7D7F8] text-black';
                                if (label === 'Low') badgeColor = 'bg-[#F8D7D7] text-black';
                                return (
                                  <span
                                    className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${badgeColor}`}
                                  >
                                    {label}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className='hidden lg:table-cell py-3 sm:py-4 px-2 sm:px-4'>
                              <span className='text-sm sm:text-base text-black'>
                                {new Date(client.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </TableCell>
                            <TableCell className='py-3 sm:py-4 px-2 sm:px-4'>
                              <div className='flex items-center justify-center gap-4 min-h-[40px]'>
                                {!client.clientStatus || client.clientStatus === 'NEEDS_INTAKE' ? (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            className='rounded-full p-2 hover:bg-[#E5D6D0] focus:outline-none flex items-center justify-center'
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            aria-label='Resend Invitation'
                                          >
                                            <Repeat className='h-5 w-5 text-[#3b82f6]' />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side='top'>Resend</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            className='rounded-full p-2 hover:bg-red-100 focus:outline-none flex items-center justify-center'
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            aria-label='Delete Invitation'
                                          >
                                            <Trash2 className='h-5 w-5 text-red-600' />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side='top'>Delete</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                ) : (
                                  <Link
                                    href={`/practitioner/clients/${client.id}/messages`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='rounded-full hover:bg-[#E5D6D0] h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center'
                                    >
                                      <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5 text-[#b7a9a3] group-hover:text-black transition' />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            {filteredClients.length === 0 && (
              <div className='text-center py-12 sm:py-16 px-4'>
                <p className='text-muted-foreground mb-4 sm:mb-6 text-base sm:text-lg'>
                  {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
                </p>
                {!searchTerm && (
                  <Link href='/practitioner/invite'>
                    <Button className='bg-black text-white rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'>
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
