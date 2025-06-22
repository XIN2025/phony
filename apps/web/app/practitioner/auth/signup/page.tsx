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
import { AuthService } from '@/services';
import Link from 'next/link';
import { Logo } from '@repo/ui/components/logo';

const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  profession: z.string().min(2, 'Profession is required.'),
  email: z.string().email('Please enter a valid email address.'),
  otp: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function PractitionerSignUpPage() {
  const [showOTP, setShowOTP] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const router = useRouter();
  const { data: session, status } = useSession();

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useMutation({
    mutationFn: async (data: { email: string }) => AuthService.sendOtp(data),
    onSuccess: () => {
      toast.success('Verification code sent successfully.');
      startResendTimer();
      setShowOTP(true);
    },
    onError: (error: any) => {
      toast.error(error.message ?? 'Failed to send OTP. Please try again.');
    },
  });

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      profession: '',
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

  async function onSubmit(values: SignUpFormValues) {
    // Prevent duplicate submissions
    if (isLoading || (showOTP && !values.otp?.trim())) {
      console.log('Form submission already in progress or OTP missing');
      return;
    }

    if (!showOTP) {
      handleSendOTP({ email: values.email.trim().toLowerCase() });
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.signupPractitioner({
        email: values.email.trim().toLowerCase(),
        otp: values.otp!.trim(),
        role: 'PRACTITIONER',
        name: `${values.firstName.trim()} ${values.lastName.trim()}`,
        profession: values.profession.trim(),
      });

      const res = await signIn('credentials', {
        email: values.email.trim().toLowerCase(),
        otp: values.otp!.trim(),
        role: 'PRACTITIONER',
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
        setIsLoading(false);
        return;
      }

      toast.success('Account created and logged in!');
      router.push('/practitioner');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Sign up failed. Please check the details and try again.';
      toast.error(errorMessage);
    }
    setIsLoading(false);
  }

  if (status === 'loading') {
    return (
      <div className='flex flex-col items-center justify-center'>
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
                    onClick={() => handleSendOTP({ email: form.getValues('email') })}
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
              <h1 className='text-2xl font-bold'>Create Your Account</h1>
              <p className='text-muted-foreground'>
                Already have an account?{' '}
                <Link href='/practitioner/auth' className='text-primary hover:underline font-medium'>
                  Login
                </Link>
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='John' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Doe' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='profession'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Therapist' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  Sign Up
                </Button>
              </form>
            </Form>
            <p className='px-8 text-center text-sm text-muted-foreground mt-6'>
              By signing up you agree to our{' '}
              <Link href='/terms' className='underline underline-offset-4 hover:text-primary'>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href='/privacy' className='underline underline-offset-4 hover:text-primary'>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
