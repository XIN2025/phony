'use client';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { toast } from 'sonner';
import { Loader2, ChevronLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { useSendOtp, useVerifyInvitationOtp, useVerifyOtp } from '@/lib/hooks/use-api';
import { useSignUpContext } from '@/context/signup-context';
import { AuthHeader } from '@/components/PageHeader';
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
    <div className='w-full flex flex-col'>
      {/* Top bar for mobile - fixed at the top */}
      <div className='block sm:hidden fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-2 w-full'>
        <div className='flex items-center w-full' style={{ minHeight: 40, padding: 0 }}>
          <img src='/Continuum.svg' alt='Continuum' style={{ height: 32, width: 'auto' }} />
        </div>
      </div>

      {/* Left-aligned card for all screens */}
      <div className='flex-1 flex flex-col items-start justify-start w-full'>
        {/* Add top margin for mobile to avoid overlap with fixed header */}
        <div className='block sm:hidden' style={{ marginTop: '64px' }}></div>
        <div className='w-full max-w-md mx-auto sm:ml-16 flex flex-col items-start justify-start rounded-xl py-6 px-4 sm:px-8 sm:mt-0 mt-4'>
          {/* Top bar for desktop */}
          <div className='hidden sm:flex w-full mb-4'>
            <div className='flex items-center w-full' style={{ minHeight: 40, padding: 0 }}>
              <img src='/Continuum.svg' alt='Continuum' style={{ height: 32, width: 'auto' }} />
            </div>
          </div>
          <h1
            className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl'
            style={{ color: '#7A6E5A', fontFamily: 'DM Serif Display, serif' }}
          >
            Confirm Your Email
          </h1>
          <p className='text-sm text-muted-foreground mb-8 w-full text-left'>
            Please enter the code we sent to
            <br />
            <span className='break-all'>{email}</span>
          </p>
          <form className='flex flex-col w-full' onSubmit={handleVerifyOtp} autoComplete='off'>
            <div className='w-full flex justify-center sm:justify-start pb-2'>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className='flex gap-1 sm:gap-2 w-full'>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className='flex-1 min-w-0 h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-white border border-gray-200 rounded-md shadow-sm text-center'
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className='w-full flex justify-between items-center mb-2'>
              <div>
                {!isInvitationFlow && (
                  <button
                    type='button'
                    onClick={handleChangeEmail}
                    className='text-xs text-primary hover:underline px-2 py-1 rounded focus:outline-none'
                    style={{ minWidth: 80 }}
                  >
                    Change Email
                  </button>
                )}
              </div>
              <div>
                {resendTimer > 0 ? (
                  <span className='text-xs text-muted-foreground'>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button
                    type='button'
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className='text-xs text-primary hover:underline disabled:opacity-50 px-2 py-1 rounded focus:outline-none'
                    style={{ minWidth: 80 }}
                  >
                    {isResending ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </div>
            <div className='w-full flex justify-center sm:justify-start'>
              <Button
                type='submit'
                className='w-full rounded-full text-base font-semibold'
                disabled={(isInvitationFlow ? isVerifyingInvitation : isVerifyingRegular) || otp.length !== 6}
              >
                {(isInvitationFlow ? isVerifyingInvitation : isVerifyingRegular) && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
