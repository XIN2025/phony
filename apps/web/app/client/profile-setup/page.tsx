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
      <div className='min-h-screen bg-background flex items-center justify-center p-4 animate-in fade-in duration-300'>
        <div className='w-full max-w-md text-center'>
          <div className='mb-8 text-center'>
            <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
          </div>
          <div className='bg-card rounded-lg shadow-lg p-8'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Setting up your profile...</h2>
            <p className='text-muted-foreground'>Please wait while we complete your profile setup.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
        </div>
        <div className='bg-card rounded-lg shadow-lg p-8'>
          <ProfileSetupForm
            onSuccess={() => {
              toast.success('Profile setup completed successfully!');
              router.push('/client');
            }}
          />
        </div>
      </div>
    </div>
  );
}
