'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useRouter } from 'next/navigation';
import { useSendOtp } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ClientAuthEmailPage() {
  const router = useRouter();
  const { mutate: sendOtp, isPending } = useSendOtp();

  const form = useForm<{ email: string }>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: { email: string }) {
    sendOtp(
      { email: values.email },
      {
        onSuccess: () => {
          toast.success('OTP sent to your email');
          router.push(`/client/auth/otp?email=${encodeURIComponent(values.email)}`);
        },
        onError: (error: any) => {
          const errorMessage = error?.message || 'Failed to send OTP. Please try again.';
          toast.error(errorMessage);
        },
      },
    );
  }

  return (
    <>
      <div className='text-center mb-6 sm:mb-8'>
        <h1 className='text-xl sm:text-2xl font-bold mb-2'>Welcome to Continuum</h1>
        <p className='text-sm sm:text-base text-muted-foreground'>
          Bridging care and connection, one session at a time.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 sm:space-y-6'>
        <div className='text-center'>
          <h2 className='text-base sm:text-lg font-semibold mb-4 sm:mb-6'>Sign In</h2>
        </div>
        <div>
          <label htmlFor='email' className='block text-sm font-medium mb-1'>
            Email ID
          </label>
          <Input
            id='email'
            type='email'
            placeholder='Your Email ID'
            {...form.register('email')}
            autoComplete='email'
            required
            className='text-sm sm:text-base'
          />
          {form.formState.errors.email && (
            <p className='text-xs sm:text-sm text-destructive mt-1'>{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button type='submit' className='w-full rounded-full py-2 sm:py-3 text-sm sm:text-base' disabled={isPending}>
          {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Send OTP
        </Button>
        <div className='text-center'>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            New client? You should have received an invitation link from your practitioner.
          </p>
        </div>
      </form>
    </>
  );
}
