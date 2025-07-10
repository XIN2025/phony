'use client';
import * as React from 'react';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Logo } from '@repo/ui/components/logo';
import { ProfileSetupForm } from '@/components/ProfileSetupForm';
import { Loader2 } from 'lucide-react';

export default function ClientProfileSetupPage() {
  const router = useRouter();

  if (false) {
    return (
      <>
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-bold mb-2'>Welcome to Continuum</h1>
          <p className='text-muted-foreground'>Bridging care and connection, one session at a time.</p>
        </div>
        <div className='text-center'>
          <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-4' />
          <h2 className='text-xl font-semibold mb-2'>Setting up your profile...</h2>
          <p className='text-muted-foreground'>Please wait while we complete your profile setup.</p>
        </div>
        <div className='flex justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      </>
    );
  }

  return (
    <>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold mb-2'>Welcome to Continuum</h1>
        <p className='text-muted-foreground'>Bridging care and connection, one session at a time.</p>
      </div>
      <div className='text-center'>
        <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-4' />
        <h2 className='text-lg font-semibold mb-6'>Profile Setup</h2>
      </div>

      <div className='bg-card rounded-lg shadow-lg p-8'>
        <ProfileSetupForm
          onSuccess={() => {
            toast.success('Profile setup completed successfully!');
            router.push('/client/medical-details');
          }}
        />
      </div>
    </>
  );
}
