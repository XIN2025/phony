'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import {
  Calendar,
  MessageCircle,
  Eye,
  Users,
  Plus,
  Menu,
  Home,
  File as FileIcon,
  MessageSquare,
  RefreshCw,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/components/sheet';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { getUserDisplayName, getInitials } from '@/lib/utils';

interface Client {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  status: 'PENDING' | 'JOINED';
  invited?: string;
  avatar?: string;
}

const engagementBadgeVariant = (engagement?: string) => {
  switch (engagement?.toLowerCase()) {
    case 'high':
      return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    case 'medium':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    case 'low':
      return 'bg-gray-50 text-gray-600 hover:bg-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const mockClients: Client[] = [
  {
    id: '1',
    clientFirstName: 'Emma',
    clientLastName: 'Chamberlin',
    clientEmail: 'emma01@gmail.com',
    status: 'JOINED',
    invited: 'May 12, 2025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=emma01@gmail.com',
  },
  {
    id: '2',
    clientFirstName: 'Jiya',
    clientLastName: '',
    clientEmail: 'jiya@gmail.com',
    status: 'JOINED',
    invited: 'May 12, 2025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jiya@gmail.com',
  },
  {
    id: '3',
    clientFirstName: 'User',
    clientLastName: '',
    clientEmail: 'user@gmail.com',
    status: 'PENDING',
    invited: 'May 12, 2025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user@gmail.com',
  },
  {
    id: '4',
    clientFirstName: 'Sheena',
    clientLastName: 'Singh',
    clientEmail: 'sheena@gmail.com',
    status: 'PENDING',
    invited: 'May 12, 2025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sheena@gmail.com',
  },
  {
    id: '5',
    clientFirstName: 'Quinn',
    clientLastName: 'Taylor',
    clientEmail: 'quinn@gmail.com',
    status: 'PENDING',
    invited: 'May 12, 2025',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=quinn@gmail.com',
  },
];

const StatCard = ({
  title,
  value,
  subtitle,
  Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  Icon: React.ElementType;
}) => (
  <Card className='relative overflow-hidden'>
    <CardHeader className='pb-2'>
      <CardTitle className='text-sm font-medium'>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Icon className='absolute -right-4 -bottom-4 h-20 w-20 text-gray-200 sm:h-28 sm:w-28' strokeWidth={1} />
      <div className='text-3xl font-bold'>{value}</div>
      <p className='text-xs text-muted-foreground'>{subtitle}</p>
    </CardContent>
  </Card>
);

export default function PractitionerDashboard() {
  const { data: session, status } = useSession();
  const displayName = getUserDisplayName(session);
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-sm text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Authentication Required</h2>
          <p className='text-muted-foreground mb-4'>Please log in to access the practitioner dashboard.</p>
          <Button onClick={() => (window.location.href = '/practitioner/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (session?.error) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Session Error</h2>
          <p className='text-muted-foreground mb-4'>Your session has expired. Please log in again.</p>
          <Button onClick={() => (window.location.href = '/practitioner/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/practitioner', icon: Home, label: 'Home' },
    { href: '/practitioner/clients', icon: Users, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/practitioner/forms', icon: FileIcon, label: 'Forms' },
  ];

  const queryClient = useQueryClient();

  const {
    data: invitations = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: ['invitations'],
    queryFn: async (): Promise<Client[]> => {
      const result = await ApiClient.get('/api/practitioner/invitations');
      return result as Client[];
    },
    enabled: status === 'authenticated' && !!session?.user?.id,
  });

  const { mutate: deleteInvitation, isPending: isDeleting } = useMutation({
    mutationFn: (invitationId: string) => ApiClient.delete(`/api/practitioner/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const { mutate: resendInvitation, isPending: isResending } = useMutation({
    mutationFn: (invitationId: string) => ApiClient.post(`/api/practitioner/invitations/${invitationId}/resend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const renderSkeleton = () => (
    <div className='space-y-4 p-4'>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-16 w-full' />
    </div>
  );

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
              <SidebarContent navLinks={navLinks} pathname={pathname} userName={displayName} />
            </SheetContent>
          </Sheet>
          <h1 className='text-2xl font-semibold'>Welcome Back, Dr. {displayName}</h1>
        </div>
        <Link href='/practitioner/invite'>
          <Button className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            <span>Invite Client</span>
          </Button>
        </Link>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <StatCard title='Total Clients' value={'12'} subtitle='+2 from last month' Icon={Users} />
        <StatCard title='Sessions this week' value='42' subtitle='+3 from last week' Icon={Calendar} />
        <StatCard title='Pending Invitations' value={invitations.length.toString()} subtitle='' Icon={MessageCircle} />
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              renderSkeleton()
            ) : isError ? (
              <div className='flex h-48 items-center justify-center'>
                <p className='text-center text-destructive'>Failed to load invitations.</p>
              </div>
            ) : invitations.length > 0 ? (
              <div className='max-h-96 overflow-y-auto'>
                <ul className='divide-y divide-gray-200'>
                  {invitations.map((invite) => (
                    <li key={invite.id} className='flex items-center justify-between p-4'>
                      <div className='flex items-center gap-4'>
                        <Avatar>
                          <AvatarImage src={invite.avatar} alt={`${invite.clientFirstName} ${invite.clientLastName}`} />
                          <AvatarFallback>
                            {getInitials(`${invite.clientFirstName} ${invite.clientLastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{`${invite.clientFirstName} ${invite.clientLastName}`}</p>
                          <p className='text-sm text-muted-foreground'>{invite.clientEmail}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='hover:bg-gray-200'
                          onClick={() => resendInvitation(invite.id)}
                          disabled={isResending}
                        >
                          <RefreshCw className='h-4 w-4' />
                          <span className='sr-only'>Resend</span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='hover:bg-red-100 hover:text-red-600'
                          onClick={() => deleteInvitation(invite.id)}
                          disabled={isDeleting}
                        >
                          <XCircle className='h-4 w-4' />
                          <span className='sr-only'>Cancel</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className='flex h-48 flex-col items-center justify-center text-center'>
                <div className='rounded-full border-8 border-gray-100 bg-white p-3'>
                  <Users className='h-8 w-8 text-gray-400' />
                </div>
                <p className='mt-4 font-medium'>No pending invitations</p>
                <p className='text-sm text-muted-foreground'>
                  When you invite a new client, you'll see their invitation status here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
