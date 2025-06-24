'use client';
import { useSession } from 'next-auth/react';
import { Button } from '@repo/ui/components/button';
import { AlertTriangle } from 'lucide-react';
interface SessionErrorHandlerProps {
  children: React.ReactNode;
}
export function SessionErrorHandler({ children }: SessionErrorHandlerProps) {
  const { data: session } = useSession();
  // Only show error for critical session errors
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
            <Button onClick={() => (window.location.href = '/practitioner/auth')} className='w-full'>
              Practitioner Login
            </Button>
            <Button variant='outline' onClick={() => (window.location.href = '/client/auth')} className='w-full'>
              Client Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // For all other cases, just render children
  return <>{children}</>;
}
