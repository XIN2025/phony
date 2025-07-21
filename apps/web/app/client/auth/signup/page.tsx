'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { clearAllAuthData } from '@/lib/auth-utils';
import { useGetInvitationByToken, useSendOtp } from '@/lib/hooks/use-api';
import { useSignUpContext } from '@/context/signup-context';
import { SignupStepper } from '@/components/SignupStepper';

export default function ClientSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { status, data: session } = useSession();
  const [email, setEmail] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { updateSignUpData } = useSignUpContext();

  const { data: invitationData, isLoading, error } = useGetInvitationByToken(token || '');
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link. Please contact your practitioner for a valid invitation.');
      router.push('/client/auth');
      return;
    }

    if (invitationData) {
      setEmail(invitationData.clientEmail);
      if (invitationData.isAccepted) {
        toast.info('This invitation has already been accepted. Please log in.');
        router.push(`/client/auth?email=${encodeURIComponent(invitationData.clientEmail)}`);
      }
    }
  }, [invitationData, router, token]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'This invitation link is invalid or has expired.';
      toast.error(errorMessage);
    }
  }, [error]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await clearAllAuthData();
      await signOut({
        redirect: false,
        callbackUrl: token ? `/client/auth/signup?token=${token}` : '/',
      });
      if (token) {
        window.location.href = `/client/auth/signup?token=${token}`;
      } else {
        window.location.href = '/';
      }
    } catch {
      setIsLoggingOut(false);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    // Store signup data and send OTP
    updateSignUpData({ email, invitationToken: token || '' });

    sendOtp(
      { email },
      {
        onSuccess: () => {
          toast.success('OTP sent to your email');
          router.push(`/client/auth/otp?email=${encodeURIComponent(email)}&token=${token || ''}`);
        },
        onError: (error: any) => {
          const errorMessage = error?.message || 'Failed to send OTP. Please try again.';
          toast.error(errorMessage);
        },
      },
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (status === 'authenticated' && session) {
    if (session.user.role === 'PRACTITIONER') {
      return (
        <>
          <AlertTriangle className='h-12 w-12 text-amber-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2 text-center'>Practitioner Account Detected</h2>
          <p className='text-muted-foreground mb-4 text-center'>
            You are currently logged in as a practitioner. To accept this client invitation, you need to log out of your
            practitioner account first.
          </p>
          <div className='space-y-2'>
            <Button onClick={handleLogout} className='w-full rounded-full' disabled={isLoggingOut}>
              {isLoggingOut && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              <LogOut className='mr-2 h-4 w-4' />
              {isLoggingOut ? 'Logging Out...' : 'Log Out as Practitioner'}
            </Button>
            <Button variant='outline' onClick={() => router.push('/practitioner')} className='w-full rounded-full'>
              Back to Practitioner Dashboard
            </Button>
          </div>
        </>
      );
    } else if (session.user.role === 'CLIENT') {
      return (
        <>
          <AlertTriangle className='h-12 w-12 text-blue-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2 text-center'>Already Logged In</h2>
          <p className='text-muted-foreground mb-4 text-center'>
            You are already logged in as a client. If you want to accept this invitation with a different account,
            please log out first.
          </p>
          <div className='space-y-2'>
            <Button onClick={handleLogout} className='w-full rounded-full' disabled={isLoggingOut}>
              {isLoggingOut && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              <LogOut className='mr-2 h-4 w-4' />
              {isLoggingOut ? 'Logging Out...' : 'Log Out'}
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                if (token) {
                  router.push(`/client/intake?token=${token}`);
                } else {
                  router.push('/client');
                }
              }}
              className='w-full rounded-full'
            >
              Back to {token ? 'Intake Form' : 'Client Dashboard'}
            </Button>
          </div>
        </>
      );
    }
  }

  if (error) {
    return (
      <>
        <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
        <h2 className='text-xl font-semibold mb-2 text-center'>Error</h2>
        <p className='text-muted-foreground mb-4 text-center'>{error.message}</p>
        <Button onClick={() => router.push('/')} className='w-full rounded-full'>
          Back to Home
        </Button>
      </>
    );
  }

  if (!email && !invitationData) {
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
          <span
            className='font-bold'
            style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#18120F', lineHeight: 1 }}
          >
            Continuum
          </span>
        </div>
      </div>

      {/* Centered card for desktop, content for mobile */}
      <div className='flex-1 flex flex-col items-center justify-center w-full'>
        {/* Add top margin for mobile to avoid overlap with fixed header */}
        <div className='block sm:hidden' style={{ marginTop: '64px' }}></div>
        <div className='w-full max-w-md mx-auto flex flex-col items-center justify-center rounded-xl py-6 px-4 sm:px-8 sm:mt-0 mt-4'>
          {/* Top bar for desktop */}
          <div className='hidden sm:flex w-full mb-4'>
            <div className='flex items-center w-full' style={{ minHeight: 40, padding: 0 }}>
              <span
                className='font-bold'
                style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#18120F', lineHeight: 1 }}
              >
                Continuum
              </span>
            </div>
          </div>

          <form onSubmit={handleNext} className='space-y-6 w-full'>
            <div>
              <Label htmlFor='email' className='block text-sm font-medium mb-1' style={{ color: '#8C8B8B' }}>
                Email ID
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='Your Email ID'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!invitationData || isSendingOtp}
                className='mt-1 bg-zinc-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                autoComplete='email'
                required
              />
            </div>
            {/* Progress bar above the button */}
            <SignupStepper totalSteps={4} currentStep={1} />
            <Button type='submit' className='w-full rounded-full' disabled={isSendingOtp}>
              {isSendingOtp && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Next
            </Button>
            <div className='text-xs sm:text-sm text-muted-foreground' style={{ lineHeight: 1.6 }}>
              By continuing, you agree to Continuum's{' '}
              <button
                type='button'
                onClick={() => toast.info('Consumer Terms and Usage Policy - Coming Soon')}
                className='font-semibold text-black hover:underline focus:outline-none'
              >
                Consumer Terms and Usage Policy
              </button>
              , and acknowledge their{' '}
              <button
                type='button'
                onClick={() => toast.info('Privacy Policy - Coming Soon')}
                className='font-semibold text-black hover:underline focus:outline-none'
              >
                Privacy Policy
              </button>
              .
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
