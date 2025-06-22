import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  loginHref: string;
  ctaButton?: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, title, description, loginHref, ctaButton, className }: AuthLayoutProps) {
  return (
    <div className={cn('bg-background min-h-screen', className)}>
      <div className='container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
        {/* Sidebar - Hidden on mobile, visible on large screens */}
        <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
          <div className='absolute inset-0 bg-zinc-900' />
          <div className='relative z-20 flex items-center text-lg font-medium'>
            <Logo className='mr-2 h-8 w-8' />
            Continuum
          </div>
          <div className='relative z-20 mt-auto'>
            <blockquote className='space-y-2'>
              <p className='text-lg'>{description}</p>
            </blockquote>
          </div>
        </div>

        {/* Main content area */}
        <div className='p-4 lg:p-8'>
          <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] lg:w-[400px]'>
            {/* Mobile header - visible only on mobile */}
            <div className='mb-6 text-center lg:hidden'>
              <div className='mb-4 flex items-center justify-center'>
                <Logo className='mr-2 h-8 w-8' />
                <span className='text-xl font-semibold'>Continuum</span>
              </div>
              <h1 className='mb-2 text-2xl font-bold'>{title}</h1>
              <p className='text-muted-foreground text-sm'>{description}</p>
            </div>

            {/* Desktop header - hidden on mobile */}
            <div className='hidden flex-col space-y-2 text-center lg:flex'>
              <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
              <p className='text-muted-foreground text-sm'>{description}</p>
            </div>

            {children}

            {ctaButton && <div className='flex justify-center'>{ctaButton}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Logo component for the sidebar
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
