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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { emailSchema, otpSchema } from '@repo/shared-types/schemas';
import { AuthService } from '@/services';
import { useMutation } from '@tanstack/react-query';
import { Logo } from '@repo/ui/components/logo';

export default function ClientAuthPage() {
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
      role: 'CLIENT',
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error ?? 'Invalid OTP');
    } else {
      router.push('/client');
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
    const targetDashboard = session.user.role === 'CLIENT' ? '/client' : '/practitioner';
    router.replace(targetDashboard);
    return null;
  }

  return (
    <div className='from-background/50 to-muted/30 flex min-h-screen w-full items-center justify-center bg-linear-to-br p-4'>
      <motion.div
        className='mx-auto w-full max-w-md'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className='w-full shadow-none'>
          <CardHeader className='space-y-2 pb-6'>
            <CardTitle className='text-center text-2xl font-semibold'>Welcome back</CardTitle>
            <CardDescription className='text-center text-sm'>
              {showOTP ? 'Enter the verification code sent to your email' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='flex flex-col items-center space-y-2'>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='name@example.com'
                          {...field}
                          disabled={showOTP}
                          className='placeholder:text-center'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AnimatePresence mode='wait'>
                  {showOTP && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className='space-y-4'
                    >
                      <FormField
                        control={form.control}
                        name='otp'
                        render={({ field }) => (
                          <FormItem className='flex flex-col items-center space-y-2'>
                            <FormLabel className='mb-3'>Verification code</FormLabel>
                            <FormControl>
                              <InputOTP value={field.value} onChange={field.onChange} maxLength={6}>
                                <InputOTPGroup>
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
                      <div className='text-center'>
                        {resendTimer > 0 ? (
                          <p className='text-muted-foreground text-sm'>Resend code in {resendTimer}s</p>
                        ) : (
                          <Button
                            type='button'
                            variant='link'
                            className='h-auto p-0 text-sm'
                            onClick={() => handleSendOTP(form.getValues('email'))}
                            disabled={isLoading || isSendingOTP}
                          >
                            Resend verification code
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type='submit' className='w-full shadow-xs' disabled={isLoading || isSendingOTP}>
                  {(isLoading || isSendingOTP) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {showOTP ? 'Verify code' : 'Continue with email'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
