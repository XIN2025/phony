import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen w-screen overflow-hidden'>
      {/* Left side with image */}
      <div className='relative hidden h-full min-h-screen w-1/2 lg:block'>
        <img src='/auth.jpg' alt='Background' className='absolute inset-0 h-full w-full object-cover' />
        {/* Optional: overlay for better contrast */}
        <div className='absolute inset-0 bg-black/10' />
      </div>

      {/* Right side with gradient background */}
      <div className='via-yellow-25 flex min-h-screen flex-1 items-center justify-center bg-gradient-to-r from-red-50 to-blue-50 p-4'>
        <div className='w-full max-w-full space-y-8 rounded-xl bg-white/80 p-2 shadow-lg sm:max-w-lg sm:p-8'>
          {children}
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
