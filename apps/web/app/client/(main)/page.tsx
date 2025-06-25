'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { User, Calendar, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const ClientPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle authentication and redirects
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/client/auth');
      return;
    }

    if (!session?.user) {
      router.push('/client/auth');
      return;
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/practitioner');
      return;
    }

    if (!session.user.firstName || !session.user.lastName) {
      router.push('/client/profile-setup');
      return;
    }

    if (session.user.clientStatus === 'NEEDS_INTAKE') {
      router.push('/client/intake');
      return;
    }
  }, [status, session, router]);

  // Show loading only while session is being determined
  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-sm text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (status === 'unauthenticated') {
    return <div className='flex h-screen items-center justify-center'>Redirecting...</div>;
  }

  // If session has error, redirect to auth page
  if (session?.error) {
    return <div className='flex h-screen items-center justify-center'>Redirecting...</div>;
  }

  // If authenticated but not a client, redirect to appropriate page
  if (status === 'authenticated' && session?.user?.role !== 'CLIENT') {
    return <div className='flex h-screen items-center justify-center'>Redirecting...</div>;
  }

  // If authenticated client but no basic profile, redirect to profile setup
  if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
    const hasBasicProfile = session.user.firstName && session.user.lastName;
    if (!hasBasicProfile) {
      return <div className='flex h-screen items-center justify-center'>Redirecting to profile setup...</div>;
    }

    // Check if client needs to complete intake form
    if (session.user.clientStatus === 'NEEDS_INTAKE') {
      return <div className='flex h-screen items-center justify-center'>Redirecting to intake form...</div>;
    }
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Welcome back, {user.firstName}!</h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Here&apos;s what&apos;s happening with your care.</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Profile Status */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Profile Status</CardTitle>
            <User className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>Complete</div>
            <p className='text-xs text-muted-foreground'>Your profile is up to date</p>
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Next Appointment</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>Not Scheduled</div>
            <p className='text-xs text-muted-foreground'>Contact your practitioner to schedule</p>
          </CardContent>
        </Card>

        {/* Intake Form Status */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Intake Form</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {user.clientStatus === 'INTAKE_COMPLETED' ? (
              <>
                <div className='text-2xl font-bold text-green-600'>Completed</div>
                <p className='text-xs text-muted-foreground'>Your intake form has been submitted</p>
              </>
            ) : user.clientStatus === 'NEEDS_INTAKE' ? (
              <>
                <div className='text-2xl font-bold text-orange-600'>Pending</div>
                <p className='text-xs text-muted-foreground'>Please complete your intake form</p>
                <Button className='mt-2' size='sm' onClick={() => router.push('/client/intake')}>
                  Complete Form
                </Button>
              </>
            ) : (
              <>
                <div className='text-2xl font-bold text-gray-600'>Not Required</div>
                <p className='text-xs text-muted-foreground'>No intake form needed at this time</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className='md:col-span-2 lg:col-span-3'>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <div className='flex-shrink-0'>
                  <CheckCircle className='h-5 w-5 text-green-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>Account Created</p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Welcome to Continuum! Your account has been successfully created.
                  </p>
                </div>
                <div className='flex-shrink-0 text-sm text-gray-500 dark:text-gray-400'>
                  <Clock className='h-4 w-4 inline mr-1' />
                  Just now
                </div>
              </div>

              {user.clientStatus === 'INTAKE_COMPLETED' && (
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>Intake Form Completed</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Your intake form has been submitted and reviewed.
                    </p>
                  </div>
                  <div className='flex-shrink-0 text-sm text-gray-500 dark:text-gray-400'>
                    <Clock className='h-4 w-4 inline mr-1' />
                    Recently
                  </div>
                </div>
              )}

              {user.clientStatus === 'NEEDS_INTAKE' && (
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    <AlertCircle className='h-5 w-5 text-orange-500' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>Intake Form Required</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Please complete your intake form to continue.
                    </p>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button size='sm' variant='outline' onClick={() => router.push('/client/intake')}>
                      Complete Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPage;
