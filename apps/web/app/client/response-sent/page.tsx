'use client';

import React, { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout, AuthHeader } from '@repo/ui/components/auth-layout';

export default function ResponseSentPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [autoRedirect, setAutoRedirect] = useState(false);

  // Auto-redirect after 2 seconds if user doesn't click the button
  React.useEffect(() => {
    if (status === 'authenticated' && !autoRedirect) {
      const timer = setTimeout(() => {
        setAutoRedirect(true);
        handleDashboardClick();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, autoRedirect]);

  const handleDashboardClick = async () => {
    if (isRedirecting) return; // Prevent double clicks

    setIsRedirecting(true);

    if (status === 'authenticated' && session?.user) {
      try {
        // Refresh session to get latest client status
        const updatedSession = await update();

        // If session was successfully updated and status is now INTAKE_COMPLETED, redirect
        if (updatedSession?.user?.clientStatus === 'INTAKE_COMPLETED') {
          router.replace('/client');
          return;
        }

        // If session update failed or status is still wrong, force a hard navigation
        window.location.href = '/client';
      } catch (error) {
        console.warn('Failed to update session before redirect:', error);
        // Force hard navigation as fallback
        window.location.href = '/client';
      }
    } else {
      // User is not authenticated, redirect to login
      router.replace('/client/auth');
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title='Response Sent' />
      <div className='text-center space-y-6'>
        <CheckCircle2 className='h-16 w-16 text-green-500 mx-auto' />
        <p className='text-muted-foreground'>
          Thank you for completing the form! Your responses have been sent successfully.
        </p>
        {!isRedirecting && !autoRedirect && (
          <p className='text-sm text-muted-foreground'>
            You'll be redirected to your dashboard automatically in a moment...
          </p>
        )}
        <Button onClick={handleDashboardClick} className='w-full rounded-full' disabled={isRedirecting}>
          {isRedirecting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {isRedirecting ? 'Redirecting...' : status === 'authenticated' ? 'Go to Dashboard' : 'Go to Login'}
        </Button>
      </div>
    </AuthLayout>
  );
}
