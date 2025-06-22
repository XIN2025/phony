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
    <div className='container mx-auto p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>Welcome back! Here's an overview of your practice.</p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{isLoading ? '...' : stats?.totalClients || 0}</div>
            <p className='text-xs text-muted-foreground'>Active clients in your practice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Intake Forms</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{isLoading ? '...' : stats?.totalForms || 0}</div>
            <p className='text-xs text-muted-foreground'>Forms available for clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Invitations</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{isLoading ? '...' : stats?.pendingInvitations || 0}</div>
            <p className='text-xs text-muted-foreground'>Invitations awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-muted-foreground'>No recent activity to display.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
