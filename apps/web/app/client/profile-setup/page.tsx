'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { Logo } from '@repo/ui/components/logo';
import { ProfileSetupForm } from '@/components/ProfileSetupForm';
import { Loader2 } from 'lucide-react';

export default function ClientProfileSetupPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [showLoading, setShowLoading] = React.useState(false);

  const initialDefaultValues = React.useMemo(
    () => ({
      firstName: session?.user?.firstName || '',
      lastName: session?.user?.lastName || '',
    }),
    [session?.user?.firstName, session?.user?.lastName],
  );

  const { mutate: handleProfileSetup, isPending } = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; profileImage?: File }) => {
      const formData = new FormData();

      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);

      if (data.profileImage) {
        formData.append('profileImage', data.profileImage);
      }

      return await ApiClient.post('/api/auth/profile', formData);
    },
    onSuccess: async () => {
      toast.success('Profile setup completed successfully!');
      setShowLoading(true);

      // Update session and navigate in parallel
      await Promise.all([
        update(),
        new Promise((resolve) => setTimeout(resolve, 800)), // Slightly longer delay for smooth transition
      ]);

      router.push('/client');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete profile setup');
      setShowLoading(false);
    },
  });

  const onSubmit = (data: { firstName: string; lastName: string; profileImage?: File }) => {
    setShowLoading(true);
    handleProfileSetup(data);
  };

  // Show loading state when either mutation is pending or we're in loading state
  if (isPending || showLoading) {
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
            onSubmit={onSubmit}
            isPending={isPending}
            defaultValues={initialDefaultValues}
            title='Complete Your Profile'
            subtitle="Let's get to know you better"
            submitText='Complete Setup'
          />
        </div>
      </div>
    </div>
  );
}
