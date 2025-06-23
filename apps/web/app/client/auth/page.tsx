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
import { useMutation } from '@tanstack/react-query';
import { emailSchema, otpSchema } from '@repo/shared-types/schemas';
import { AuthService } from '@/services';
import { Logo } from '@repo/ui/components/logo';
export default function ClientAuthPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const router = useRouter();
  const { status } = useSession();
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
    defaultValues: { email: '' },
  });
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };
  async function onSubmit(values: z.infer<typeof emailSchema>) {
    if (!showOTP) {
      handleSendOTP(values.email);
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
        router.push('/client/profile-setup');
        toast.success('Logged in successfully');
      }
    } catch (error) {
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
                onClick={() => handleSendOTP(form.getValues('email'))}
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
  if (status === 'loading')
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  return (
    <>
      <div className='mb-8 text-center'>
        <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
      </div>
      <div className='flex flex-col space-y-2 text-left mb-8'>
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
