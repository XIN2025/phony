'use client';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { useSendOtp, useVerifyInvitationOtp, useVerifyOtp } from '@/lib/hooks/use-api';
import { useSignUpContext } from '@/context/signup-context';
import { AuthHeader } from '@repo/ui/components/auth-layout';
import { signIn } from 'next-auth/react';

export default function ClientOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const [otp, setOtp] = useState('');
  const { signUpData } = useSignUpContext();

  const { mutate: verifyInvitationOtp, isPending: isVerifyingInvitation } = useVerifyInvitationOtp();
  const { mutate: verifyRegularOtp, isPending: isVerifyingRegular } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useSendOtp();

  const isInvitationFlow = !!token;

  const [resendTimer, setResendTimer] = useState(0);
  const timerCleanupRef = useRef<(() => void) | null>(null);

  const startResendTimer = () => {
    if (timerCleanupRef.current) timerCleanupRef.current();
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
    timerCleanupRef.current = () => clearInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (timerCleanupRef.current) timerCleanupRef.current();
    };
  }, []);

  useEffect(() => {
    if (!email) {
      toast.error('Email is required.');
      router.push('/client/auth');
      return;
    }

    if (isInvitationFlow) {
      if (!token) {
        toast.error('Invalid access. Please start from the invitation link.');
        router.push('/client/auth');
        return;
      }

      if (!signUpData.email || !signUpData.invitationToken) {
        toast.error('Please complete the previous step first.');
        router.push(`/client/auth/signup?token=${token}`);
        return;
      }
    }
  }, [email, token, signUpData, router, isInvitationFlow]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!email) {
      toast.error('Email is required.');
      return;
    }

    if (isInvitationFlow) {
      if (!token) {
        toast.error('Invitation token is required.');
        return;
      }

      verifyInvitationOtp(
        { email, otp, invitationToken: token },
        {
          onSuccess: () => {
            toast.success('OTP verified successfully!');
            router.push(`/client/personal-details?token=${token}`);
          },
          onError: (error: any) => {
            const errorMessage = error?.message || 'Invalid OTP. Please try again.';
            toast.error(errorMessage);
            setOtp('');
          },
        },
      );
    } else {
      verifyRegularOtp(
        { email, otp, role: 'CLIENT' },
        {
          onSuccess: async (response) => {
            toast.success('Signed in successfully!');

            const signInResult = await signIn('credentials', {
              email: response.user.email,
              token: response.token,
              role: 'CLIENT',
              redirect: false,
            });

            if (signInResult?.error) {
              toast.error('Failed to sign in. Please try again.');
              return;
            }

            router.push('/client');
          },
          onError: (error: any) => {
            const errorMessage = error?.message || 'Invalid OTP. Please try again.';
            toast.error(errorMessage);
            setOtp('');
          },
        },
      );
    }
  };

  const handleResendOtp = () => {
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    resendOtp(
      { email },
      {
        onSuccess: () => {
          toast.success('OTP sent to your email');
          startResendTimer();
        },
        onError: (error: any) => {
          const errorMessage = error?.message || 'Failed to resend OTP. Please try again.';
          toast.error(errorMessage);
        },
      },
    );
  };

  const handleChangeEmail = () => {
    if (isInvitationFlow && token) {
      router.push(`/client/auth/signup?token=${token}`);
    } else {
      router.push('/client/auth');
    }
  };

  if (!email) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <AuthHeader title='Enter OTP' />
      <div className='flex justify-center w-full'>
        <form className='space-y-6 w-full max-w-full p-4 sm:p-6' onSubmit={handleVerifyOtp}>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground mb-4'>We've sent you an OTP at "{email}"</p>
            <div className='flex justify-center mb-6'>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className='gap-2 sm:gap-2 gap-1'>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className='w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold'
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className='flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-6'>
              <button type='button' onClick={handleChangeEmail} className='text-sm text-primary hover:underline'>
                Change Email
              </button>
              {resendTimer > 0 ? (
                <span className='text-sm text-muted-foreground'>Resend OTP in {resendTimer}s</span>
              ) : (
                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className='text-sm text-primary hover:underline disabled:opacity-50'
                >
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
          <Button
            type='submit'
            className='w-full rounded-full'
            disabled={(isInvitationFlow ? isVerifyingInvitation : isVerifyingRegular) || otp.length !== 6}
          >
            {(isInvitationFlow ? isVerifyingInvitation : isVerifyingRegular) && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            {isInvitationFlow ? 'Next' : 'Sign In'}
          </Button>
        </form>
      </div>
    </>
  );
}
