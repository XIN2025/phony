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
  const { data: session, status, update } = useSession();

  React.useEffect(() => {
    console.log('[PractitionerAuth] Session status changed:', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      isLoading,
      showOTP,
    });

    if (status === 'authenticated' && session && session.user?.role === 'PRACTITIONER') {
      console.log('[PractitionerAuth] User authenticated, redirecting...', session.user);
      router.replace('/practitioner');
    }
  }, [status, session?.user?.role, router, isLoading, showOTP]);

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
        console.log('[PractitionerAuth] SignIn successful, forcing session update...');
        await update();
        // The useEffect will handle the redirect once session is updated
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
      <motion.div key='email' className='space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel className='text-sm font-medium text-gray-700'>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='email'
                  placeholder='Enter your email'
                  className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full h-12 text-base font-medium' disabled={isSendingOTP}>
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
    <div className='min-h-screen flex flex-col lg:flex-row'>
      {/* Left side - Image section */}
      <div className='hidden lg:flex lg:w-3/5 relative overflow-hidden'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: 'url(/auth.jpg)' }}
        ></div>
        <div className='absolute inset-0 bg-black/20'></div>

        {/* Logo in bottom left */}
        <div className='absolute bottom-6 left-6'>
          <div className='w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center'>
            <span className='text-white text-sm font-bold'>N</span>
          </div>
        </div>
      </div>

      {/* Right side - Form section */}
      <div className='flex-1 lg:w-2/5 flex flex-col min-h-screen'>
        {/* Main content area */}
        <div className='flex-1 flex flex-col justify-start items-center px-4 pt-16 pb-32'>
          <div className='w-full max-w-md space-y-8'>
            {/* Header content */}
            <div className='text-center space-y-4'>
              <h1
                className='text-3xl font-bold tracking-tight text-[#8d8080]'
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Welcome to Continuum
              </h1>
              <p className='text-base text-gray-700 leading-relaxed'>
                Make the time between sessions count — along with the sessions themselves
              </p>
              <div className='mt-8'>
                <h2 className='text-2xl tracking-tighter text-gray-800 mb-2'>Sign In</h2>
                <p className='text-sm text-gray-600'>
                  {showOTP
                    ? `Please enter the code we sent to ${email}`
                    : "We'll send you a code to this email to verify your sign in"}
                </p>
              </div>
            </div>

            {/* Form Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                <AnimatePresence mode='wait'>{renderContent()}</AnimatePresence>
              </form>
            </Form>

            {/* Sign up link */}
            <div className='text-center text-sm'>
              Don't have an account?{' '}
              <Link href='/practitioner/auth/signup' className='font-medium text-primary hover:underline'>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
