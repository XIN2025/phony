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
import Link from 'next/link';

export default function PractitionerAuthPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const router = useRouter();
  const { data: session, status } = useSession();

  // If already authenticated, redirect to appropriate dashboard
  React.useEffect(() => {
    if (status === 'authenticated' && session) {
      const targetDashboard = session.user.role === 'PRACTITIONER' ? '/practitioner' : '/client';
      router.replace(targetDashboard);
    }
  }, [session, status, router]);

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
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
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
          onError: () => {
            setIsLoading(false);
            toast.error('Failed to submit form. Please try again.');
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
        role: 'PRACTITIONER',
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error ?? 'Invalid OTP');
      } else {
        toast.success('Logged in successfully');
        // Let the useEffect handle the redirect
      }
    } catch (_error: unknown) {
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
                      onError: () => {
                        toast.error('Failed to resend OTP');
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

  if (session) {
    return null;
  }

  return (
    <>
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>{showOTP ? 'Check your email' : 'Practitioner Login'}</h1>
        <p className='text-muted-foreground'>
          {showOTP
            ? `We've sent a code to ${form.getValues('email')}`
            : 'Welcome back! Please sign in to your account.'}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
          <AnimatePresence mode='wait'>{renderContent()}</AnimatePresence>
        </form>
      </Form>
      <div className='text-center text-sm'>
        Don't have an account?{' '}
        <Link href='/practitioner/auth/signup' className='font-medium text-primary hover:underline'>
          Sign up
        </Link>
      </div>
    </>
  );
}
