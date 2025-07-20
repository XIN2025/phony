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
import { Loader2, ChevronLeft } from 'lucide-react';

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
    <div className='w-full flex flex-col'>
      {/* Top bar for mobile - fixed at the top */}
      <div className='block sm:hidden fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-2 w-full'>
        <div className='flex items-center w-full' style={{ minHeight: 40, padding: 0 }}>
          <button
            type='button'
            onClick={() => router.push('/')}
            aria-label='Back'
            className='flex items-center justify-center mr-2 focus:outline-none'
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', height: 28, width: 28 }}
          >
            <ChevronLeft
              style={{
                stroke: '#807171',
                width: 28,
                height: 28,
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            />
          </button>
          <img src='/Continuum.png' alt='Continuum' style={{ height: 32, width: 'auto' }} />
        </div>
      </div>

      {/* Centered card for desktop, content for mobile */}
      <div className='flex-1 flex flex-col items-center justify-center w-full'>
        {/* Add top margin for mobile to avoid overlap with fixed header */}
        <div className='block sm:hidden' style={{ marginTop: '64px' }}></div>
        <div className='w-full max-w-md mx-auto flex flex-col items-center justify-center rounded-xl py-6 px-4 sm:px-8 sm:mt-0 mt-4'>
          {/* Top bar for desktop */}
          <div className='hidden sm:flex w-full mb-4'>
            <div className='flex items-center w-full' style={{ minHeight: 40, padding: 0 }}>
              <button
                type='button'
                onClick={() => router.push('/')}
                aria-label='Back'
                className='flex items-center justify-center mr-2 focus:outline-none'
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', height: 28, width: 28 }}
              >
                <ChevronLeft
                  style={{
                    stroke: '#807171',
                    width: 28,
                    height: 28,
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}
                />
              </button>
              <img src='/Continuum.png' alt='Continuum' style={{ height: 32, width: 'auto' }} />
            </div>
          </div>

          {/* Branding header for all screen sizes */}
          <div className='mb-3 flex flex-col items-start'>
            <div className='text-left'>
              <span className='text-base font-tighter'>
                <span className='text-muted-foreground font-semibold'>Where</span> Therapy & Coaching{' '}
                <span className='text-muted-foreground font-semibold'>Becomes</span> Action & Accountability
              </span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 w-full'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium mb-1 ' style={{ color: '#8C8B8B' }}>
                Email ID
              </label>
              <Input
                id='email'
                type='email'
                placeholder='Your Email ID'
                {...form.register('email')}
                autoComplete='email'
                required
                className='text-sm sm:text-base bg-zinc-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              />
              {form.formState.errors.email && (
                <p className='text-xs sm:text-sm text-destructive mt-1'>{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button
              type='submit'
              className='w-full rounded-full py-2 sm:py-3 text-sm sm:text-base'
              disabled={isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Sign In
            </Button>
            {/* Legal text below button */}
            <div className='text-center'>
              <p className='text-xs sm:text-sm text-muted-foreground mt-2'>
                By continuing, you agree to Continuum's{' '}
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
        </div>
      </div>
    </div>
  );
}
