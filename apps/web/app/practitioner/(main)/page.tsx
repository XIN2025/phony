'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Users, Calendar, Mail, Eye, MessageSquare, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import Link from 'next/link';

// NOTE: I've updated the client data to include a unique 'id' for the map key.
// This is a better practice than using the name.
const clients = [
  {
    id: 1,
    name: 'Emma Chamberlin',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    id: 2,
    name: 'Jiya',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Low',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    id: 3,
    name: 'Justin King',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    id: 4,
    name: 'Henry Hugh',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    id: 5,
    name: 'Fatima Wasim',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Joined',
  },
  {
    id: 6,
    name: 'Ana',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Medium',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
  {
    id: 7,
    name: 'Sheena Singh',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'Low',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
  {
    id: 8,
    name: 'Quinn Taylor',
    email: 'emma01@gmail.com',
    lastSession: 'May 10, 2025',
    engagement: 'High',
    lastActive: 'May 10, 2025',
    status: 'Pending',
  },
];

// Helper to get initials for Avatars
const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]?.[0] ?? ''}${names[names.length - 1]?.[0] ?? ''}`;
  }
  return name.substring(0, 2);
};

export default function PractitionerDashboard() {
  const { data: session } = useSession();

  // The design uses "Dr. Ana", so we format it this way.
  // Falls back gracefully if session data is not available.
  const practitionerName = session?.user?.name?.split(' ')[0] || 'Ana';

  return (
    // Increased overall padding for a more spacious feel like the design.
    <div className='flex flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h1 className='text-3xl font-bold text-gray-800'>Welcome Back Dr. {practitionerName}</h1>
        {/* Styled the button to be black as per the design */}
        <Link href='/practitioner/invite'>
          <Button className='bg-gray-900 text-white hover:bg-gray-800'>
            <Plus className='mr-2 h-4 w-4' /> Invite Client
          </Button>
        </Link>
      </div>

      {/* --- STATS CARDS --- */}
      {/* Cards are updated to include the large, stylized background icons */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='relative overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {/* The design's icons are custom. We can replicate the effect with Lucide icons
                by making them large, semi-transparent, and positioning them in the background. */}
            <Users className='absolute -right-4 -top-4 h-24 w-24 text-gray-100' />
            <div className='text-3xl font-bold'>14</div>
            <p className='text-xs text-muted-foreground'>+2 from last month</p>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Sessions this week</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className='absolute -right-4 -top-4 h-24 w-24 text-gray-100' />
            <div className='text-3xl font-bold'>42</div>
            <p className='text-xs text-muted-foreground'>+3 from last week</p>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <Mail className='absolute -right-4 -top-4 h-24 w-24 text-gray-100' />
            <div className='text-3xl font-bold'>2</div>
            {/* The design doesn't have subtitle text here, so it's removed for accuracy. */}
          </CardContent>
        </Card>
      </div>

      {/* --- LAST ACTIVE CLIENTS LIST --- */}
      {/* Replaced the <table> with a more flexible and modern div-based grid layout.
          This is key to matching the design's spacing and alignment. */}
      <Card>
        <CardHeader>
          <CardTitle>Last Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {/* This wrapper ensures the list can scroll horizontally on small screens, preventing layout breaks. */}
          <div className='overflow-x-auto'>
            <div className='min-w-[1000px]'>
              {/* Header Row */}
              <div className='grid grid-cols-12 gap-4 border-b pb-4 text-sm font-medium text-muted-foreground'>
                <div className='col-span-3'>Member</div>
                <div className='col-span-2'>Last Session</div>
                <div className='col-span-2'>Engagement</div>
                <div className='col-span-2'>Last Active</div>
                <div className='col-span-1'>Status</div>
                <div className='col-span-2 text-right'>Actions</div>
              </div>

              {/* Client Rows */}
              <div className='flex flex-col'>
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className='grid grid-cols-12 items-center gap-4 border-b py-4 transition-colors hover:bg-gray-50'
                  >
                    {/* Member */}
                    <div className='col-span-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          {/* The design uses gray placeholders instead of images */}
                          <AvatarFallback className='bg-gray-200 text-gray-600'>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium text-gray-800'>{client.name}</p>
                          <p className='text-sm text-muted-foreground'>{client.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Last Session */}
                    <div className='col-span-2 flex items-center gap-2 text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span>{client.lastSession}</span>
                    </div>

                    {/* Engagement */}
                    <div className='col-span-2'>
                      {/* Styled the badge to be more like a pill, as in the design. */}
                      <Badge
                        variant={
                          client.engagement === 'High'
                            ? 'default'
                            : client.engagement === 'Medium'
                              ? 'secondary'
                              : 'outline'
                        }
                        className='rounded-full px-3 py-1 font-normal capitalize'
                      >
                        {client.engagement}
                      </Badge>
                    </div>

                    {/* Last Active */}
                    <div className='col-span-2 flex items-center gap-2 text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span>{client.lastActive}</span>
                    </div>

                    {/* Status */}
                    <div className='col-span-1 text-muted-foreground'>{client.status}</div>

                    {/* Actions */}
                    <div className='col-span-2 flex items-center justify-end gap-2'>
                      <Button variant='ghost' size='icon' aria-label='Message Client'>
                        <MessageSquare className='h-5 w-5' />
                      </Button>
                      <Button variant='ghost' size='icon' aria-label='View Client Details'>
                        <Eye className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
