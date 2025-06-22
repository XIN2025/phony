import { Button } from '@repo/ui/components/button';
import { Logo } from '@repo/ui/components/logo';
import Link from 'next/link';
import * as React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
            <h2 className='text-3xl font-bold text-foreground mb-4'>Unlock Your Potential</h2>
            <p className='text-muted-foreground max-w-sm'>
              Join a community of professionals dedicated to making a difference through evidence-based practices.
            </p>
          </div>
          <div className='text-sm text-muted-foreground self-center'>
            © {new Date().getFullYear()} Continuum Inc. All rights reserved.
          </div>
        </div>

        {/* Right Panel */}
        <div className='flex flex-col items-center justify-center p-6 relative'>
          <div className='absolute top-6 right-6 flex items-center gap-4'>
            <Link href='/practitioner/auth' className='text-sm font-medium hover:underline'>
              Login
            </Link>
            <Button asChild>
              <Link href='/practitioner/auth/signup'>Get Started</Link>
            </Button>
          </div>
          <div className='w-full max-w-md'>{children}</div>
        </div>
      </div>
    </div>
  );
}
