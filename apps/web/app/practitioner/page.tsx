'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Users, Calendar, Mail, Eye, MessageSquare, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import Link from 'next/link';

const clients = [
  {
    name: 'Emma Chamberlin',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    name: 'Jiya',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Low',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    name: 'Justin King',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    name: 'Henry Hugh',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    name: 'Fatima Wasim',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    name: 'Ana',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
  {
    name: 'Sheena Singh',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Low',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
  {
    name: 'Quinn Taylor',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
];

export default function PractitionerDashboard() {
  const { data: session } = useSession();

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-semibold'>Welcome Back, {session?.user?.name?.split(' ')[0] || 'Ana'}</h1>
        <Link href='/practitioner/invite'>
          <Button>
            <Plus className='mr-2 h-4 w-4' /> Invite Client
          </Button>
        </Link>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-neutral-200 dark:border-neutral-800'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
          </CardHeader>
          <CardContent className='flex items-start justify-between'>
            <div>
              <div className='text-3xl font-bold'>14</div>
              <p className='text-xs text-muted-foreground'>+2 from last month</p>
            </div>
            <Users className='h-10 w-10 text-muted-foreground' />
          </CardContent>
        </Card>
        <Card className='border-neutral-200 dark:border-neutral-800'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Sessions this week</CardTitle>
          </CardHeader>
          <CardContent className='flex items-start justify-between'>
            <div>
              <div className='text-3xl font-bold'>42</div>
              <p className='text-xs text-muted-foreground'>+3 from last week</p>
            </div>
            <Calendar className='h-10 w-10 text-muted-foreground' />
          </CardContent>
        </Card>
        <Card className='border-neutral-200 dark:border-neutral-800'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Unread Messages</CardTitle>
          </CardHeader>
          <CardContent className='flex items-start justify-between'>
            <div className='text-3xl font-bold'>2</div>
            <Mail className='h-10 w-10 text-muted-foreground' />
          </CardContent>
        </Card>
      </div>

      <Card className='border-neutral-200 dark:border-neutral-800'>
        <CardHeader>
          <CardTitle>Last Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='text-sm text-muted-foreground'>
                <tr className='border-b border-neutral-200 dark:border-neutral-800'>
                  <th className='p-4 text-left font-medium'>Member</th>
                  <th className='p-4 text-left font-medium'>Last Session</th>
                  <th className='p-4 text-left font-medium'>Engagement</th>
                  <th className='p-4 text-left font-medium'>Last Active</th>
                  <th className='p-4 text-left font-medium'>Status</th>
                  <th className='p-4 text-right font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.name} className='border-b border-neutral-200 dark:border-neutral-800'>
                    <td className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={`/avatars/${client.name}.png`} alt={client.name} />
                          <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{client.name}</p>
                          <p className='text-sm text-muted-foreground'>{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        {client.lastSession}
                      </div>
                    </td>
                    <td className='p-4'>
                      <Badge variant='secondary' className='rounded-full px-3 py-1'>
                        {client.engagement}
                      </Badge>
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        {client.lastActive}
                      </div>
                    </td>
                    <td className='p-4 text-muted-foreground'>{client.status}</td>
                    <td className='p-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button variant='ghost' size='icon'>
                          <MessageSquare className='h-5 w-5' />
                        </Button>
                        <Button variant='ghost' size='icon'>
                          <Eye className='h-5 w-5' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
