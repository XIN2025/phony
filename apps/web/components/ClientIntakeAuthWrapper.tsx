'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ClientIntakeAuthWrapperProps {
  children: React.ReactNode;
}

const ClientIntakeAuthWrapper = ({ children }: ClientIntakeAuthWrapperProps) => {
  const { status, data: session } = useSession();
  const router = useRouter();

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

    if (session.user.clientStatus === 'INTAKE_COMPLETED') {
      router.push('/client');
      return;
    }

    if (session.user.clientStatus === 'PENDING' || session.user.clientStatus === 'ACTIVE') {
      router.push('/client');
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

  if (
    status === 'unauthenticated' ||
    !session?.user ||
    session.user.role !== 'CLIENT' ||
    session.user.clientStatus === 'INTAKE_COMPLETED' ||
    session.user.clientStatus === 'PENDING' ||
    session.user.clientStatus === 'ACTIVE'
  ) {
    return <div className='flex h-screen items-center justify-center'>Redirecting...</div>;
  }

  return <>{children}</>;
};

export default ClientIntakeAuthWrapper;
