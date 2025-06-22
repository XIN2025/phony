'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { LogOut, User, Calendar, FileText, MessageCircle } from 'lucide-react';

const ClientPage = () => {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className='bg-background p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold'>Client Dashboard</h1>
            <p className='text-muted-foreground'>Welcome back, {session?.user?.name || session?.user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant='outline'>
            <LogOut className='w-4 h-4 mr-2' />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid md:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>My Practitioner</CardTitle>
              <User className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>-</div>
              <p className='text-xs text-muted-foreground'>Not connected yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Upcoming Sessions</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>0</div>
              <p className='text-xs text-muted-foreground'>No sessions scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Treatment Plans</CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>0</div>
              <p className='text-xs text-muted-foreground'>No plans available</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access your therapy resources and communication</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid md:grid-cols-2 gap-4'>
              <Button className='h-20' variant='outline'>
                <div className='text-left'>
                  <div className='font-medium'>Complete Intake Form</div>
                  <div className='text-sm text-muted-foreground'>Fill out your intake questionnaire</div>
                </div>
              </Button>
              <Button className='h-20' variant='outline'>
                <div className='text-left'>
                  <div className='font-medium'>Message Practitioner</div>
                  <div className='text-sm text-muted-foreground'>Send a message to your practitioner</div>
                </div>
              </Button>
              <Button className='h-20' variant='outline'>
                <div className='text-left'>
                  <div className='font-medium'>View Treatment Plan</div>
                  <div className='text-sm text-muted-foreground'>Access your current treatment plan</div>
                </div>
              </Button>
              <Button className='h-20' variant='outline'>
                <div className='text-left'>
                  <div className='font-medium'>Session History</div>
                  <div className='text-sm text-muted-foreground'>View past session records</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground mb-4'>
              Welcome to Continuum! Your practitioner will send you an invitation to get started. Once connected, you'll
              be able to access your treatment plans, communicate with your practitioner, and track your progress.
            </p>
            <div className='flex items-center text-sm text-muted-foreground'>
              <MessageCircle className='w-4 h-4 mr-2' />
              Waiting for practitioner invitation...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPage;
