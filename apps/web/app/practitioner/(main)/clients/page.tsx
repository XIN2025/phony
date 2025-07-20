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

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: clients = [], isLoading, error } = useGetClients();

  const getActivityLabel = (client: any) => {
    if (!client.clientStatus) return 'Invitation Pending';
    if (client.clientStatus === 'NEEDS_INTAKE') return 'Invitation Pending';

    if (!client.hasCompletedIntake) {
      return 'Low';
    }

    return 'Low';
  };

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
            <h1 className='text-2xl font-bold tracking-tight' style={{ fontFamily: "'DM Serif Display', serif" }}>
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
            <h1 className='text-xl font-bold tracking-tight  ' style={{ fontSize: '39px' }}>
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
          <h1 className='text-xl   font-bold tracking-tight truncate' style={{ fontSize: '32px' }}>
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
        <div className='w-full   min-w-0'>
          <div className='mb-6 sm:mb-8'>
            <div className='relative w-full max-w-md ml-0'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4'>
                <Search className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
              </div>
              <Input
                placeholder='Search Clients'
                className='pl-10 sm:pl-12 w-full rounded-full border border-[#E5D6D0] bg-white/80 py-2 sm:py-3 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-[#E5D6D0]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className='w-full bg-white rounded-xl sm:rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] sm:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-0 p-0 overflow-hidden min-w-0'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <h2
                className='text-base font-semibold mb-4 sm:mb-6 lg:mb-8'
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px' }}
              >
                Last Active Clients
              </h2>
              <div className='overflow-x-auto'>
                <div className='min-w-full inline-block align-middle'>
                  <div className='overflow-hidden border border-gray-200/40 rounded-lg'>
                    <Table className='min-w-full text-xs sm:text-sm lg:text-base'>
                      <colgroup>
                        <col className='w-[25%]' />
                        <col className='w-[25%]' />
                        <col className='w-[15%]' />
                        <col className='w-[20%]' />
                        <col className='w-[10%]' />
                        <col className='w-[5%]' />
                      </colgroup>
                      <TableHeader>
                        <TableRow className='border-b border-gray-200/60 bg-gray-50/50'>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base'>
                            Member
                          </TableHead>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base hidden sm:table-cell'>
                            Email ID
                          </TableHead>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base hidden md:table-cell'>
                            Phone
                          </TableHead>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base'>
                            Plan Engagement
                          </TableHead>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-xs sm:text-sm lg:text-base hidden lg:table-cell'>
                            Last Active
                          </TableHead>
                          <TableHead className='py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-6 text-center font-semibold text-gray-700 text-xs sm:text-sm lg:text-base'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow
                            key={client.id}
                            className='group cursor-pointer hover:bg-gray-50/50 transition-colors h-[26px]'
                            onClick={() => handleClientRowClick(client.id)}
                          >
                            <TableCell className='py-1.5 px-3 sm:px-4 lg:px-6'>
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
                            <TableCell className='hidden sm:table-cell py-1.5 px-3 sm:px-4 lg:px-6 text-gray-700 text-xs sm:text-sm lg:text-base'>
                              <span className='truncate block'>{client.email}</span>
                            </TableCell>
                            <TableCell className='hidden md:table-cell py-1.5 px-3 sm:px-4 lg:px-6 text-gray-700 text-xs sm:text-sm lg:text-base'>
                              <span>{client.phoneNumber || '-'}</span>
                            </TableCell>
                            <TableCell className='py-1.5 px-3 sm:px-4 lg:px-6'>
                              {(() => {
                                const label = getActivityLabel(client);
                                const badgeColor = (() => {
                                  switch (label) {
                                    case 'Low':
                                      return 'bg-[#F8D7D7] text-black';
                                    case 'Invitation Pending':
                                      return 'bg-gray-100 text-gray-700';
                                    default:
                                      return 'bg-[#E5D6D0] text-black';
                                  }
                                })();
                                return (
                                  <span
                                    className={`px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${badgeColor}`}
                                  >
                                    {label}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className='hidden lg:table-cell py-1.5 px-3 sm:px-4 lg:px-6 text-gray-700 text-xs sm:text-sm lg:text-base'>
                              <span>
                                {client.hasCompletedIntake && client.clientStatus !== 'NEEDS_INTAKE' ? (
                                  new Date(client.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                ) : (
                                  <span className='text-gray-500 italic'>Nil</span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className='py-1.5 px-3 sm:px-4 lg:px-6 text-center align-middle'>
                              <div className='flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 min-h-[20px] sm:min-h-[24px] lg:min-h-[26px]'>
                                {!client.clientStatus || client.clientStatus === 'NEEDS_INTAKE' ? (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-gray-200/50 focus:outline-none flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7'
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            aria-label='Resend Invitation'
                                          >
                                            <Repeat className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-blue-600' />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side='top'>Resend</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-red-100 focus:outline-none flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7'
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            aria-label='Delete Invitation'
                                          >
                                            <Trash2 className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-red-600' />
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
                                      className='rounded-full p-1 sm:p-1.5 lg:p-2 hover:bg-gray-200/50 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 flex items-center justify-center'
                                    >
                                      <MessageCircle className='h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-600' />
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
