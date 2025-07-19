import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { User } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className='fixed inset-0 flex min-h-screen w-screen overflow-hidden'
      style={{
        background: 'linear-gradient(135deg, #fecaca 0%, #ffffff 50%, #dbeafe 100%)',
      }}
    >
      {/* Left side with image */}
      <div className='relative hidden h-full min-h-screen w-1/2 lg:block'>
        <img src='/auth.jpg' alt='Background' className='absolute inset-0 h-full w-full object-cover' />
        {/* Overlay for better contrast */}
        <div className='absolute inset-0 bg-black/20' />

        {/* Logo in bottom left */}
        <div className='absolute bottom-6 left-6'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-800'>
            <span className='text-sm font-bold text-white'>N</span>
          </div>
        </div>
      </div>

      {/* Right side with content */}
      <div
        className='flex min-h-screen w-full flex-col lg:w-1/2'
        style={{
          background: 'linear-gradient(135deg, #fecaca 0%, #ffffff 50%, #dbeafe 100%)',
        }}
      >
        {/* Main content area */}
        <div
          className='flex flex-1 flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-16'
          style={{
            background: 'linear-gradient(135deg, #fecaca 0%, #ffffff 50%, #dbeafe 100%)',
          }}
        >
          <div className='w-full max-w-sm space-y-6 sm:max-w-md sm:space-y-8'>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthHeader({ title }: { title: string }) {
  return (
    <>
      <div className='mb-6 text-center sm:mb-8'>
        <h1 className='mb-2 text-xl font-bold sm:text-2xl' style={{ fontFamily: "'Playfair Display', serif" }}>
          Welcome to Continuum
        </h1>
        <p className='text-muted-foreground text-sm sm:text-base'>
          Bridging care and connection, one session at a time.
        </p>
      </div>
      <div className='text-center'>
        <h2
          className='mb-4 text-base font-semibold sm:mb-6 sm:text-lg'
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h2>
      </div>
    </>
  );
}
