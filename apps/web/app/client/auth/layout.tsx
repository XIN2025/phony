'use client';

import { useSession } from 'next-auth/react';
import React from 'react';
import { Button } from '@repo/ui/components/button';
import { Logo } from '@repo/ui/components/logo';
import { AuthLayout } from '@repo/ui/components/auth-layout';
import Link from 'next/link';

const ClientAuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className='flex flex-col items-center justify-center bg-background'>
        <Logo className='h-10 w-10 animate-pulse' />
      </div>
    );
  }

  return (
    <AuthLayout
      title='Your Journey Begins Here'
      description='Connect with your healthcare provider and take the first step towards better health and wellness.'
      loginHref='/client/auth'
      ctaButton={
        <Button asChild>
          <Link href='/'>Back to Home</Link>
        </Button>
      }
    >
      {children}
    </AuthLayout>
  );
};

export default ClientAuthLayout;
