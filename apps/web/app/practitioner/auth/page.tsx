'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { signIn, useSession } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { emailSchema, otpSchema } from '@repo/shared-types';
import { useSendOtp } from '@/lib/hooks/use-api';
import { handleLoginError } from '@/lib/auth-utils';

export default function PractitionerAuthPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [resendTimer, setResendTimer] = React.useState(0);
  const timerCleanupRef = React.useRef<(() => void) | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    console.log('[PractitionerAuth] Session status changed:', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      isLoading,
      showOTP,
    });

    if (status === 'authenticated' && session) {
      console.log('[PractitionerAuth] User authenticated, redirecting...', session.user);
      const targetDashboard = session.user.role === 'PRACTITIONER' ? '/practitioner' : '/client';
      router.replace(targetDashboard);
    }
  }, [status, session?.user?.role, router]); // Fixed dependencies

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useSendOtp();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(showOTP ? otpSchema : emailSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  const startResendTimer = () => {
    // Clear any existing timer
    if (timerCleanupRef.current) {
      timerCleanupRef.current();
    }

    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          timerCleanupRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store cleanup function for proper memory management
    timerCleanupRef.current = () => clearInterval(interval);
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
      }
    };
  }, []);

  async function onSubmit(values: z.infer<typeof emailSchema>) {
    if (!showOTP) {
      setEmail(values.email);
      handleSendOTP(
        { email: values.email },
        {
          onSuccess: () => {
            toast.success('OTP sent successfully');
            startResendTimer();
            setShowOTP(true);
          },
          onError: (error: Error) => {
            setIsLoading(false);
            toast.error(error.message ?? 'Failed to send verification code.');
          },
        },
      );
      return;
    }

    setIsLoading(true);
    console.log('[PractitionerAuth] Starting login process...', { email, role: 'PRACTITIONER' });

    try {
      const res = await signIn('credentials', {
        email: email,
        otp: values.otp,
        role: 'PRACTITIONER',
        redirect: false,
      });

      console.log('[PractitionerAuth] SignIn response:', res);

      if (res?.error) {
        console.error('[PractitionerAuth] SignIn error:', res.error);
        const errorMessage = handleLoginError(res.error, 'PRACTITIONER');
        toast.error(errorMessage);
      } else if (res?.ok) {
        console.log('[PractitionerAuth] SignIn successful, waiting for session update...');
        toast.success('Logged in successfully');
        // Remove manual redirect - let useEffect handle it
      } else {
        console.warn('[PractitionerAuth] Unexpected signIn response:', res);
        toast.error('Login failed - unexpected response');
      }
    } catch (error: unknown) {
      console.error('[PractitionerAuth] SignIn exception:', error);
      toast.error('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    if (showOTP) {
      return (
        <motion.div key='otp' className='space-y-4 sm:space-y-6'>
          <FormField
            control={form.control}
            name='otp'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputOTP {...field} maxLength={6}>
                    <InputOTPGroup className='w-full justify-center gap-1 sm:gap-2'>
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
          <div className='flex justify-between text-xs sm:text-sm'>
            <Button type='button' variant='link' className='p-0 text-xs sm:text-sm' onClick={() => setShowOTP(false)}>
              Change Email
            </Button>
            {resendTimer > 0 ? (
              <span className='text-muted-foreground text-xs sm:text-sm'>Resend code in {resendTimer}s</span>
            ) : (
              <Button
                type='button'
                variant='link'
                className='p-0 text-xs sm:text-sm'
                onClick={() =>
                  handleSendOTP(
                    { email: form.getValues('email') },
                    {
                      onSuccess: () => {
                        toast.success('OTP resent successfully');
                        startResendTimer();
                      },
                      onError: (error: Error) => {
                        toast.error(error.message ?? 'Failed to resend verification code');
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
          <Button type='submit' className='w-full py-2 sm:py-3 text-sm sm:text-base' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sign In
          </Button>
        </motion.div>
      );
    }
    return (
      <motion.div key='email' className='space-y-4 sm:space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm sm:text-base'>Email</FormLabel>
              <FormControl>
                <Input {...field} type='email' placeholder='Enter your email' className='text-sm sm:text-base' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full py-2 sm:py-3 text-sm sm:text-base' disabled={isSendingOTP}>
          {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Send Verification Code
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
        <h1 className='text-2xl font-bold tracking-tight'>{showOTP ? 'Check your email' : 'Practitioner Login'}</h1>
        <p className='text-muted-foreground'>
          {showOTP ? `We've sent a code to ${email}` : 'Welcome back! Please sign in to your account.'}
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
