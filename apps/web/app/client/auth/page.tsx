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
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Welcome to Continuum</h1>
        <p className='text-muted-foreground'>
          Make the time between sessions count — along with the sessions themselves
        </p>
        <h2 className='text-xl font-semibold mt-4'>Sign In</h2>
        <p className='text-sm text-muted-foreground'>We'll send you a code to this email to verify your sign in.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 sm:space-y-6'>
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
          Sign In
        </Button>
        {/* Legal text below button */}
        <div className='text-center'>
          <p className='text-xs sm:text-sm text-muted-foreground mt-4'>
            By continuing, you agree to Continuum’s{' '}
            <a href='#' className='underline'>
              Consumer Terms and Usage Policy
            </a>
            , and acknowledge their{' '}
            <a href='#' className='underline'>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </form>
    </>
  );
}
