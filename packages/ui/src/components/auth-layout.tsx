import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  image?: React.ReactNode;
}

export function AuthLayout({ children, image }: AuthLayoutProps) {
  return (
    <div className='bg-background w-full lg:grid lg:min-h-screen lg:grid-cols-2'>
      {/* Left side panel */}
      <div className='relative hidden h-full items-center justify-center bg-zinc-900 p-10 text-white lg:flex'>
        <div className='absolute inset-0' />
        {image && <div className='relative z-20'>{image}</div>}
      </div>

      {/* Right side form */}
      <div className='flex min-h-screen items-center justify-center p-4 sm:p-6 lg:min-h-0 lg:p-8'>
        <div className='mx-auto w-full max-w-md space-y-6'>{children}</div>
      </div>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
    </svg>
  );
}
