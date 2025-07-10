import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='bg-background flex min-h-screen w-full'>
      {/* Left side gray panel */}
      <div className='hidden w-1/2 bg-zinc-200 lg:block' />

      {/* Right side form */}
      <div className='flex flex-1 items-center justify-center p-4'>
        <div className='w-full max-w-lg space-y-8'>{children}</div>
      </div>
    </div>
  );
}

export function AuthHeader({ title }: { title: string }) {
  return (
    <>
      <div className='mb-8 text-center'>
        <h1 className='mb-2 text-2xl font-bold'>Welcome to Continuum</h1>
        <p className='text-muted-foreground'>Bridging care and connection, one session at a time.</p>
      </div>
      <div className='text-center'>
        <h2 className='mb-6 text-lg font-semibold'>{title}</h2>
      </div>
    </>
  );
}
