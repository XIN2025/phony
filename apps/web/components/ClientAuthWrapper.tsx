'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ClientAuthWrapperProps {
  children: React.ReactNode;
}

const ClientAuthWrapper = ({ children }: ClientAuthWrapperProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session?.user) {
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

  if (status === 'unauthenticated' || !session?.user || session?.error || session.user.role !== 'CLIENT') {
    return <div className='flex h-screen items-center justify-center'>Redirecting...</div>;
  }

  return <>{children}</>;
};

export default ClientAuthWrapper;
