'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@repo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { emailSchema, otpSchema } from '@repo/shared-types/schemas';
import { useSendOtp } from '@/lib/hooks/use-api';

export default function ClientAuthPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const router = useRouter();
  const { status, data: session } = useSession();

  // Redirect authenticated users to appropriate dashboard
  React.useEffect(() => {
    if (status === 'authenticated' && session) {
      if (session.user.role === 'CLIENT') {
        router.replace('/client');
      } else if (session.user.role === 'PRACTITIONER') {
        router.replace('/practitioner');
      }
    }
  }, [status, session, router]);

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useSendOtp();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(showOTP ? otpSchema : emailSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  const startResendTimer = () => {
    setResendTimer(60);
    setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  async function onSubmit(values: z.infer<typeof emailSchema>) {
    if (!showOTP) {
      handleSendOTP(
        { email: values.email },
        {
          onSuccess: () => {
            toast.success('OTP sent successfully');
            startResendTimer();
            setShowOTP(true);
          },
          onError: (error: Error) => {
            if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
              toast.error('Request timed out. The OTP may have been sent. Please check your email and try again.');
            } else if (error.message?.includes('network') || error.message?.includes('connection')) {
              toast.error('Network error. Please check your connection and try again.');
            } else {
              toast.error(error.message ?? 'Failed to send OTP. Please try again.');
            }
          },
        },
      );
      return;
    }
    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email: values.email,
        otp: values.otp,
        role: 'CLIENT',
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error ?? 'Invalid OTP');
      } else {
        toast.success('Logged in successfully');
        router.push('/client');
      }
    } catch {
      toast.error('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    if (showOTP) {
      return (
        <motion.div key='otp' className='space-y-6'>
          <FormField
            control={form.control}
            name='otp'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputOTP {...field} maxLength={6}>
                    <InputOTPGroup className='w-full justify-center gap-2'>
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-between text-sm'>
            <Button type='button' variant='link' className='p-0' onClick={() => setShowOTP(false)}>
              Change Email
            </Button>
            {resendTimer > 0 ? (
              <span className='text-muted-foreground'>Resend code in {resendTimer}s</span>
            ) : (
              <Button
                type='button'
                variant='link'
                className='p-0'
                onClick={() =>
                  handleSendOTP(
                    { email: form.getValues('email') },
                    {
                      onSuccess: () => {
                        toast.success('OTP resent successfully');
                        startResendTimer();
                      },
                      onError: (error: Error) => {
                        if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
                          toast.error(
                            'Request timed out. The OTP may have been sent. Please check your email and try again.',
                          );
                        } else if (error.message?.includes('network') || error.message?.includes('connection')) {
                          toast.error('Network error. Please check your connection and try again.');
                        } else {
                          toast.error(error.message ?? 'Failed to resend OTP');
                        }
                      },
                    },
                  )
                }
                disabled={isSendingOTP}
              >
                Resend code
              </Button>
            )}
          </div>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sign In
          </Button>
        </motion.div>
      );
    }
    return (
      <motion.div key='email' className='space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder='you@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isSendingOTP}>
          {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Continue with Email
        </Button>
      </motion.div>
    );
  };

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (status === 'authenticated') {
    return (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>{showOTP ? 'Check your email' : 'Client Portal Login'}</h1>
        <p className='text-muted-foreground'>
          {showOTP ? `We've sent a code to ${form.getValues('email')}` : 'Please sign in to access your dashboard.'}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
          <AnimatePresence mode='wait'>{renderContent()}</AnimatePresence>
        </form>
      </Form>
    </>
  );
}
