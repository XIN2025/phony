'use client';
import React, { useMemo } from 'react';
import { useCachedSession } from '@/lib/hooks/use-session';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface SessionErrorHandlerProps {
  children: React.ReactNode;
}

function SessionErrorHandlerComponent({ children }: SessionErrorHandlerProps) {
  const { data: session, status } = useCachedSession();
  const router = useRouter();

  const errorContent = useMemo(() => {
    if (status === 'loading') {
      return (
        <div className='flex h-screen items-center justify-center'>
          <Loader2 className='h-12 w-12 animate-spin text-muted-foreground' />
        </div>
      );
    }

    if (session?.error && (session.error === 'UserNotFound' || session.error === 'InvalidToken')) {
      return (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center max-w-md mx-auto p-6'>
            <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Session Error</h2>
            <p className='text-muted-foreground mb-4'>
              Your session has expired or encountered an error. Please log in again to continue.
            </p>
            <div className='space-y-2'>
              <Button onClick={() => router.push('/practitioner/auth')} className='w-full'>
                Practitioner Login
              </Button>
              <Button variant='outline' onClick={() => router.push('/client/auth')} className='w-full'>
                Client Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [session?.error, status, router]);

  if (errorContent) {
    return errorContent;
  }

  return <>{children}</>;
}

export const SessionErrorHandler = React.memo(SessionErrorHandlerComponent);
