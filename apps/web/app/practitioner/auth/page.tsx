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
import { AuthService } from '@/services';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Logo } from '@repo/ui/components/logo';

export default function PractitionerAuthPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [sessionTimeout, setSessionTimeout] = React.useState(false);
  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs((prev) => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  // Add timeout for session loading
  React.useEffect(() => {
    addLog(`Session status changed to: ${status}`);
    if (status === 'loading') {
      addLog('Session is loading, starting timeout timer...');
      const timer = setTimeout(() => {
        addLog('Session loading timeout reached!');
        setSessionTimeout(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else {
      addLog(`Session loading completed. Status: ${status}`);
      setSessionTimeout(false);
    }
  }, [status]);

  React.useEffect(() => {
    addLog('Auth page component mounted');
    addLog(`Initial session status: ${status}`);
    addLog(`Session data: ${JSON.stringify(session)}`);
  }, []);

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useMutation({
    mutationFn: async (email: string) => {
      addLog(`🚀 Starting OTP send process for: ${email}`);
      addLog(`📡 Making API call to: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/otp`);

      try {
        const result = await AuthService.sendOtp({ email });
        addLog(`✅ OTP API call successful: ${JSON.stringify(result)}`);
        return result;
      } catch (error) {
        addLog(`❌ OTP API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        addLog(`❌ Error details: ${JSON.stringify(error)}`);
        throw error;
      }
    },
    onSuccess: () => {
      addLog('🎉 OTP mutation onSuccess called');
      toast.success('OTP sent successfully');
      startResendTimer();
      setShowOTP(true);
      addLog('✅ OTP form state updated - showing OTP input');
    },
    onError: (error) => {
      addLog(`💥 OTP mutation onError called: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Mutation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    },
  });

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(showOTP ? otpSchema : emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const startResendTimer = () => {
    addLog('⏰ Starting resend timer (60 seconds)');
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          addLog('⏰ Resend timer completed');
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  async function onSubmit(values: z.infer<typeof emailSchema>) {
    addLog(`📝 Form submitted with values: ${JSON.stringify(values)}`);

    if (!showOTP) {
      addLog('📧 First step: Sending OTP...');
      handleSendOTP(values.email);
      return;
    }

    addLog('🔐 Second step: Verifying OTP...');
    setIsLoading(true);
    addLog('🔄 Setting loading state to true');

    try {
      addLog('🔑 Calling signIn with credentials...');
      const res = await signIn('credentials', {
        email: values.email,
        otp: values.otp,
        role: 'PRACTITIONER',
        redirect: false,
      });

      addLog(`🔑 SignIn result: ${JSON.stringify(res)}`);

      if (res?.error) {
        addLog(`❌ SignIn error: ${res.error}`);
        toast.error(res.error ?? 'Invalid OTP');
      } else {
        addLog('✅ SignIn successful, redirecting to /practitioner');
        router.push('/practitioner');
        toast.success('Logged in successfully');
      }
    } catch (error) {
      addLog(`💥 SignIn exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('SignIn error:', error);
      toast.error('An error occurred during sign in');
    } finally {
      addLog('🔄 Setting loading state to false');
      setIsLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className='flex flex-col items-center justify-center p-4'>
        <Logo className='h-8 w-8 sm:h-10 sm:w-10 animate-pulse' />
        {sessionTimeout && (
          <div className='mt-4 text-center'>
            <p className='text-sm text-muted-foreground mb-2'>Session loading is taking longer than expected</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                addLog('🔄 User clicked retry button');
                window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (session) {
    const targetDashboard = session.user.role === 'PRACTITIONER' ? '/practitioner' : '/client';
    router.replace(targetDashboard);
    return null;
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      {/* Debug logs display */}
      {process.env.NODE_ENV === 'development' && (
        <div className='mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs max-h-32 overflow-y-auto'>
          <strong>Debug Logs:</strong>
          {debugLogs.map((log, index) => (
            <div key={index} className='text-gray-600'>
              {log}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode='wait'>
        <motion.div
          key={showOTP ? 'otp' : 'form'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {showOTP ? (
            <div className='space-y-4 sm:space-y-6'>
              <div className='text-left space-y-2'>
                <h1 className='text-xl sm:text-2xl font-bold'>Enter Verification Code</h1>
                <p className='text-sm sm:text-base text-muted-foreground'>A 6-digit code was sent to your email.</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 sm:space-y-6'>
                  <FormField
                    control={form.control}
                    name='otp'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputOTP {...field} maxLength={6}>
                            <InputOTPGroup className='w-full justify-between gap-1 sm:gap-2'>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Verify
                  </Button>
                </form>
              </Form>
              <div className='text-center text-xs sm:text-sm'>
                {resendTimer > 0 ? (
                  <p className='text-muted-foreground'>Resend code in {resendTimer}s</p>
                ) : (
                  <p>
                    Didn't receive code?{' '}
                    <Button
                      type='button'
                      variant='link'
                      className='p-0 h-auto text-xs sm:text-sm'
                      onClick={() => {
                        addLog('🔄 User clicked resend button');
                        handleSendOTP(form.getValues('email'));
                      }}
                      disabled={isSendingOTP}
                    >
                      Resend Now
                    </Button>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className='space-y-4 sm:space-y-6'>
              <div className='text-left space-y-2'>
                <h1 className='text-xl sm:text-2xl font-bold'>Sign In to Your Account</h1>
                <p className='text-sm sm:text-base text-muted-foreground'>
                  Don't have an account?{' '}
                  <Link href='/practitioner/auth/signup' className='text-primary hover:underline font-medium'>
                    Sign Up
                  </Link>
                </p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 sm:space-y-6'>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type='email' placeholder='john.doe@example.com' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type='submit' className='w-full' disabled={isSendingOTP}>
                    {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Continue with Email
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
