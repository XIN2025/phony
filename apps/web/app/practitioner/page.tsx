'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Users, FileText, MessageSquare, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';

interface DashboardStats {
  totalClients: number;
  totalForms: number;
  pendingInvitations: number;
}

export default function PractitionerDashboard() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [clientsRes, formsRes, invitationsRes] = await Promise.all([
        ApiClient.get<any[]>('/api/practitioner/clients'),
        ApiClient.get<any[]>('/api/intake-forms'),
        ApiClient.get<any[]>('/api/practitioner/invitations'),
      ]);

      return {
        totalClients: clientsRes.length || 0,
        totalForms: formsRes.length || 0,
        pendingInvitations: invitationsRes.filter((inv: any) => inv.status === 'pending').length || 0,
      };
    },
  });

  return (
    <div className='container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6'>
      <div className='space-y-2 sm:space-y-3'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold'>Dashboard</h1>
        <p className='text-sm sm:text-base text-muted-foreground'>Welcome back! Here's an overview of your practice.</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>Total Clients</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-xl sm:text-2xl font-bold'>{isLoading ? '...' : stats?.totalClients || 0}</div>
            <p className='text-xs text-muted-foreground'>Active clients in your practice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>Intake Forms</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-xl sm:text-2xl font-bold'>{isLoading ? '...' : stats?.totalForms || 0}</div>
            <p className='text-xs text-muted-foreground'>Forms available for clients</p>
          </CardContent>
        </Card>

        <Card className='sm:col-span-2 lg:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-xs sm:text-sm font-medium'>Pending Invitations</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-xl sm:text-2xl font-bold'>{isLoading ? '...' : stats?.pendingInvitations || 0}</div>
            <p className='text-xs text-muted-foreground'>Invitations awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Quick Actions</CardTitle>
            <CardDescription className='text-sm'>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() => router.push('/practitioner/clients')}
            >
              <Plus className='w-4 h-4 mr-2' />
              Invite New Client
            </Button>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() => router.push('/practitioner/intake-forms')}
            >
              <FileText className='w-4 h-4 mr-2' />
              Create Intake Form
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Recent Activity</CardTitle>
            <CardDescription className='text-sm'>Latest updates from your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-muted-foreground'>No recent activity to display.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
