import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { User } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen w-screen overflow-hidden'>
      {/* Left side with image */}
      <div className='relative hidden h-full min-h-screen w-1/2 lg:block'>
        <img src='/auth.jpg' alt='Background' className='absolute inset-0 h-full w-full object-cover' />
        {/* Overlay for better contrast */}
        <div className='absolute inset-0 bg-black/20' />

        {/* Content overlay on left side */}
        <div className='relative z-10 flex h-full w-full items-center justify-center'>
          <div className='text-center text-white'>
            <div className='mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
              <User className='h-16 w-16 text-white' />
            </div>
            <p className='text-lg font-medium'>Welcome to Continuum</p>
            <p className='mt-2 text-sm opacity-90'>Professional therapy platform</p>
          </div>
        </div>

        {/* Logo in bottom left */}
        <div className='absolute bottom-6 left-6'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-800'>
            <span className='text-sm font-bold text-white'>N</span>
          </div>
        </div>
      </div>

      {/* Right side with content */}
      <div className='flex min-h-screen w-full flex-col lg:w-1/2'>
        {/* Main content area */}
        <div className='flex flex-1 flex-col items-center justify-start px-4 pt-16 pb-32'>
          <div className='w-full max-w-md space-y-8'>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthHeader({ title }: { title: string }) {
  return (
    <>
      <div className='mb-8 text-center'>
        <h1 className='mb-2 text-2xl font-bold' style={{ fontFamily: "'Playfair Display', serif" }}>
          Welcome to Continuum
        </h1>
        <p className='text-muted-foreground'>Bridging care and connection, one session at a time.</p>
      </div>
      <div className='text-center'>
        <h2 className='mb-6 text-lg font-semibold' style={{ fontFamily: "'Playfair Display', serif" }}>
          {title}
        </h2>
      </div>
    </>
  );
}
