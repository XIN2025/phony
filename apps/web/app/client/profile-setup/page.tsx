'use client';
import * as React from 'react';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Logo } from '@repo/ui/components/logo';
import { ProfileSetupForm } from '@/components/ProfileSetupForm';
import { Loader2 } from 'lucide-react';
import { useCheckInvitationIntakeForm } from '@/lib/hooks/use-api';
import { useSignUpContext } from '@/context/signup-context';

export default function ClientProfileSetupPage() {
  const router = useRouter();
  const { mutate: checkIntakeForm } = useCheckInvitationIntakeForm();

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
    <div className='flex flex-col w-full max-w-full overflow-x-hidden px-4 sm:px-6 md:px-8 min-w-0'>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold mb-2' style={{ fontFamily: "'Playfair Display', serif" }}>
          Welcome to Continuum
        </h1>
        <p className='text-muted-foreground'>Bridging care and connection, one session at a time.</p>
      </div>
      <div className='text-center'>
        <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-4' />
        <h2 className='text-lg font-semibold mb-6' style={{ fontFamily: "'Playfair Display', serif" }}>
          Profile Setup
        </h2>
      </div>
      <div className='bg-card rounded-lg shadow-lg p-4 sm:p-8'>
        <ProfileSetupForm
          onSuccess={() => {
            toast.success('Profile setup completed successfully!');
            // After profile setup, check for intake form and route accordingly
            const token = new URLSearchParams(window.location.search).get('token');
            const { email, invitationToken } = useSignUpContext().signUpData;
            if (!email || !invitationToken) {
              router.push('/client');
              return;
            }
            checkIntakeForm(
              { invitationToken },
              {
                onSuccess: (checkResult) => {
                  if (checkResult.hasIntakeForm) {
                    router.push(`/client/intake?token=${token}`);
                  } else {
                    router.push(`/client`);
                  }
                },
                onError: () => {
                  router.push(`/client`);
                },
              },
            );
          }}
        />
      </div>
    </div>
  );
}
