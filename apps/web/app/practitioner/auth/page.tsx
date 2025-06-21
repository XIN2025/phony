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
  const router = useRouter();
  const { data: session, status } = useSession();

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useMutation({
    mutationFn: (email: string) => AuthService.sendOtp({ email }),
    onSuccess: () => {
      toast.success('OTP sent successfully');
      startResendTimer();
      setShowOTP(true);
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to send OTP');
    },
  });

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(showOTP ? otpSchema : emailSchema),
    defaultValues: {
      email: '',
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
      handleSendOTP(values.email);
      return;
    }

    setIsLoading(true);
    const res = await signIn('credentials', {
      email: values.email,
      otp: values.otp,
      role: 'PRACTITIONER',
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error ?? 'Invalid OTP');
    } else {
      router.push('/practitioner');
      toast.success('Logged in successfully');
    }
    setIsLoading(false);
  }

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <Logo className='h-10 w-10 animate-pulse' />
      </div>
    );
  }

  if (session) {
    const targetDashboard = session.user.role === 'PRACTITIONER' ? '/practitioner' : '/client';
    router.replace(targetDashboard);
    return null;
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={showOTP ? 'otp' : 'form'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {showOTP ? (
          <div>
            <div className='text-left mb-8'>
              <h1 className='text-2xl font-bold'>Enter Verification Code</h1>
              <p className='text-muted-foreground'>A 6-digit code was sent to your email.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='otp'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputOTP {...field} maxLength={6}>
                          <InputOTPGroup className='w-full justify-between'>
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
            <div className='mt-4 text-center text-sm'>
              {resendTimer > 0 ? (
                <p className='text-muted-foreground'>Resend code in {resendTimer}s</p>
              ) : (
                <p>
                  Didn't receive code?{' '}
                  <Button
                    type='button'
                    variant='link'
                    className='p-0 h-auto'
                    onClick={() => handleSendOTP(form.getValues('email'))}
                    disabled={isSendingOTP}
                  >
                    Resend Now
                  </Button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className='text-left mb-8'>
              <h1 className='text-2xl font-bold'>Sign In to Your Account</h1>
              <p className='text-muted-foreground'>
                Don't have an account?{' '}
                <Link href='/practitioner/auth/signup' className='text-primary hover:underline font-medium'>
                  Sign Up
                </Link>
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
  );
}
