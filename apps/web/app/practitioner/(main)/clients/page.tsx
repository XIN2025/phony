'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Input } from '@repo/ui/components/input';
import { MessageCircle, Eye, Plus, Search, Menu, Home, Users, MessageSquare, File as FileIcon } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { Skeleton } from '@repo/ui/components/skeleton';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/components/sheet';
import { usePathname } from 'next/navigation';
import { SidebarContent, getInitials } from '@/components/practitioner/Sidebar';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  status: 'PENDING' | 'JOINED';
  lastSession?: string;
  engagement?: string;
  phone?: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    firstName: 'Sophie',
    lastName: 'Bennett',
    email: 'sophiebennett@gmail.com',
    status: 'JOINED',
    engagement: 'Medium',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '2',
    firstName: 'Jiya',
    lastName: '',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'Low',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '3',
    firstName: 'Justin',
    lastName: 'King',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'Medium',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '4',
    firstName: 'Henry',
    lastName: 'Hugh',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'High',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '5',
    firstName: 'Fatima',
    lastName: 'Wasim',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'High',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '6',
    firstName: 'Ana',
    lastName: '',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'Medium',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '7',
    firstName: 'Sheena',
    lastName: 'Singh',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'Low',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '8',
    firstName: 'Quinn',
    lastName: 'Taylor',
    email: 'emma01@gmail.com',
    status: 'JOINED',
    engagement: 'High',
    lastSession: 'May 10, 2025',
    phone: '+91 9876543210',
  },
  {
    id: '9',
    firstName: 'Jake',
    lastName: '',
    email: 'emma01@gmail.com',
    status: 'PENDING',
    lastSession: '-',
    phone: '+91 9876543210',
  },
];

const engagementBadgeVariant = (engagement?: string) => {
  switch (engagement?.toLowerCase()) {
    case 'high':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const renderSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell colSpan={6}>
          <Skeleton className='h-12 w-full' />
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default function ClientsPage() {
  const { data: session }: { data: Session | null } = useSession();
  const userName = session?.user?.name ?? 'Ana Johnson';
  const pathname = usePathname();

  const navLinks = [
    { href: '/practitioner', icon: Home, label: 'Home' },
    { href: '/practitioner/clients', icon: Users, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/practitioner/forms', icon: FileIcon, label: 'Forms' },
  ];
  const {
    data: clients = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockClients;
    },
    enabled: !!session,
  });

  return (
    <>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Sheet>
            <SheetTrigger asChild>
              <Button size='icon' variant='outline' className='lg:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='max-w-xs p-0'>
              <SidebarContent navLinks={navLinks} pathname={pathname} userName={userName} />
            </SheetContent>
          </Sheet>
          <h1 className='text-2xl font-semibold'>Clients</h1>
        </div>
        <Link href='/practitioner/invite'>
          <Button className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            <span>Invite Client</span>
          </Button>
        </Link>
      </div>
      <div className='relative w-full max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
        <Input placeholder='Search Clients' className='pl-10 w-full' />
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Session</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                renderSkeleton()
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center text-destructive'>
                    Failed to load clients.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={client.avatar} alt={`${client.firstName} ${client.lastName}`} />
                          <AvatarFallback>{getInitials(`${client.firstName} ${client.lastName}`)}</AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>{`${client.firstName} ${client.lastName}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || '+91 9876543210'}</TableCell>
                    <TableCell>
                      {client.status === 'PENDING' ? (
                        <Badge variant='secondary'>Invitation Pending</Badge>
                      ) : (
                        <Badge className={engagementBadgeVariant(client.engagement)}>
                          {client.engagement || 'N/A'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{client.lastSession || '-'}</TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='icon'>
                        <MessageCircle className='h-5 w-5' />
                      </Button>
                      <Button variant='ghost' size='icon'>
                        <Eye className='h-5 w-5' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
