'use client';

import { useSession } from 'next-auth/react';
import React from 'react';
import { Button } from '@repo/ui/components/button';
import { Logo } from '@repo/ui/components/logo';
import Link from 'next/link';

const ClientAuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-background'>
        <Logo className='h-10 w-10 animate-pulse' />
      </div>
    );
  }

  return (
    <div className='min-h-screen w-full'>
      <div className='grid h-screen w-full grid-cols-1 lg:grid-cols-2'>
        {/* Left Panel */}
        <div className='bg-muted hidden lg:flex flex-col items-center justify-between p-8 text-white'>
          <div className='self-start'>
            <Link href='/' className='flex items-center gap-2'>
              <Logo className='w-8 h-8' />
              <span className='text-xl font-bold text-foreground'>Continuum</span>
            </Link>
          </div>
          <div className='flex flex-col items-center justify-center text-center flex-grow'>
            <div className='w-80 h-80 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-8'>
              <span className='text-muted-foreground'>IMG</span>
            </div>
            <h2 className='text-3xl font-bold text-foreground mb-4'>Your Journey Begins Here</h2>
            <p className='text-muted-foreground max-w-sm'>
              Connect with your healthcare provider and take the first step towards better health and wellness.
            </p>
          </div>
          <div className='text-sm text-muted-foreground self-center'>
            © {new Date().getFullYear()} Continuum Inc. All rights reserved.
          </div>
        </div>

        {/* Right Panel */}
        <div className='flex flex-col items-center justify-center p-6 relative'>
          <div className='absolute top-6 right-6 flex items-center gap-4'>
            <Link href='/client/auth' className='text-sm font-medium hover:underline'>
              Login
            </Link>
            <Button asChild>
              <Link href='/'>Back to Home</Link>
            </Button>
          </div>
          <div className='w-full max-w-md'>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ClientAuthLayout;
