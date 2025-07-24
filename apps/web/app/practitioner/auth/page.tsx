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
import { useSendOtp, useVerifyOtp } from '@/lib/hooks/use-api';
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
  const { mutateAsync: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();

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
        { email: values.email, role: 'PRACTITIONER' },
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
    try {
      // FIX: Verify OTP via backend before signIn
      if (!email) {
        toast.error('Email is required.');
        setIsLoading(false);
        return;
      }
      if (!values.otp) {
        toast.error('OTP is required.');
        setIsLoading(false);
        return;
      }
      const response = await verifyOtp({ email: email, otp: values.otp, role: 'PRACTITIONER' });
      if (!response || !response.token) {
        toast.error('OTP verification failed. Please try again.');
        setIsLoading(false);
        return;
      }
      const res = await signIn('credentials', {
        email: response.user.email,
        token: response.token,
        role: 'PRACTITIONER',
        redirect: false,
      });
      if (res?.error) {
        const errorMessage = handleLoginError(res.error, 'PRACTITIONER');
        toast.error(errorMessage);
      } else if (res?.ok) {
        await update();
      } else {
        toast.error('Login failed - unexpected response');
      }
    } catch (error: any) {
      toast.error(error?.message || 'An error occurred during sign in');
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
          <div className='flex flex-row justify-between items-center text-xs sm:text-sm w-full'>
            <Button type='button' variant='link' className='p-0 text-xs sm:text-sm' onClick={() => setShowOTP(false)}>
              Change Email
            </Button>
            {resendTimer > 0 ? (
              <span className='text-muted-foreground text-right'>Resend code in {resendTimer}s</span>
            ) : (
              <Button
                type='button'
                variant='link'
                className='p-0 text-xs sm:text-sm text-right'
                onClick={() =>
                  handleSendOTP(
                    { email: form.getValues('email'), role: 'PRACTITIONER' },
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
          <Button
            type='submit'
            className='w-full py-2 bg-[#807171] sm:py-3 text-sm sm:text-base rounded-full'
            disabled={isLoading || isVerifyingOtp}
          >
            {(isLoading || isVerifyingOtp) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
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
              <FormLabel className='text-sm font-medium text-gray-700' style={{ color: '#8C8B8B' }}>
                Email ID
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='email'
                  placeholder='Enter your email'
                  className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  bg-zinc-50'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full bg-[#807171] h-12 text-base font-medium rounded-full'
          disabled={isSendingOTP}
        >
          {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Send Verification Code
        </Button>
      </motion.div>
    );
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex flex-col lg:flex-row auth-gradient'>
        {/* Left side - Image section */}
        <div className='hidden lg:flex lg:w-3/5 relative overflow-hidden'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat'
            style={{ backgroundImage: 'url(/auth.jpg)' }}
          ></div>
          <div className='absolute inset-0 bg-black/20'></div>
        </div>

        {/* Right side - Loading section */}
        <div className='flex-1 lg:w-2/5 flex flex-col min-h-screen auth-gradient'>
          <div className='flex-1 flex flex-col justify-center items-center px-4'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className='min-h-screen flex flex-col lg:flex-row auth-gradient'>
        {/* Left side - Image section */}
        <div className='hidden lg:flex lg:w-3/5 relative overflow-hidden'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat'
            style={{ backgroundImage: 'url(/auth.jpg)' }}
          ></div>
          <div className='absolute inset-0 bg-black/20'></div>
        </div>

        {/* Right side - Loading section */}
        <div className='flex-1 lg:w-2/5 flex flex-col min-h-screen auth-gradient'>
          <div className='flex-1 flex flex-col justify-center items-center px-4'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col lg:flex-row auth-gradient'>
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
      <div className='flex-1 lg:w-2/5 flex flex-col min-h-screen auth-gradient'>
        {/* Main content area */}
        <div className='flex-1 flex flex-col justify-start items-center px-4 pt-16 pb-32 auth-gradient'>
          <div className='w-full max-w-md space-y-8'>
            {/* Header content */}
            <div className='w-full text-center space-y-6 auth-header'>
              {/* Welcome section - single div for alignment */}
              <div className='w-full text-center mt-4  '>
                <h1
                  className='font-bold tracking-tight text-[#8d8080] text-center'
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', textAlign: 'center' }}
                >
                  Welcome to Continuum
                </h1>
                <p
                  className='text-gray-700 px-7 leading-relaxed text-center'
                  style={{ fontSize: '20px', textAlign: 'center' }}
                >
                  Make the time between sessions count — along with the sessions themselves
                </p>
              </div>

              {/* Content section - single div for all content below */}
              <div className='w-full text-center space-y-2'>
                <h2
                  className='tracking-tighter text-gray-800 text-center'
                  style={{ fontSize: '28px', textAlign: 'center' }}
                >
                  Sign In
                </h2>
                <p className='text-sm text-gray-600 text-center' style={{ textAlign: 'center' }}>
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
