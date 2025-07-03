'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Loader2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function ClientAuthPage() {
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[ClientAuth] Session status changed:', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      isLoading,
      showOTP,
      cookies: document.cookie,
    });
  }, [status, session, isLoading, showOTP]);

  useEffect(() => {
    console.log('[ClientAuth] Session update - detailed:', {
      status,
      session: session
        ? {
            user: session.user
              ? {
                  id: session.user.id,
                  email: session.user.email,
                  role: session.user.role,
                  firstName: session.user.firstName,
                }
              : null,
            expires: session.expires,
          }
        : null,
    });

    if (status === 'authenticated' && session?.user) {
      console.log('[ClientAuth] User authenticated, redirecting...', session.user);
      if (session.user.role === 'CLIENT') {
        window.location.href = '/client';
      } else if (session.user.role === 'PRACTITIONER') {
        window.location.href = '/practitioner';
      }
    }
  }, [status, session?.user?.role, session]);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[ClientAuth] Sending OTP...', { email, role: 'CLIENT' });
      await ApiClient.post('/api/auth/otp', {
        email,
        role: 'CLIENT',
      });
      setShowOTP(true);
      console.log('[ClientAuth] OTP sent successfully');
    } catch (err: any) {
      console.error('[ClientAuth] OTP sending failed:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp) {
      setError('Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[ClientAuth] Starting login process...', { email, role: 'CLIENT' });
      const result = await signIn('credentials', {
        email,
        otp,
        role: 'CLIENT',
        redirect: false,
      });

      console.log('[ClientAuth] SignIn response:', result);

      if (result?.error) {
        console.error('[ClientAuth] SignIn error:', result.error);
        setError(result.error);
      } else if (result?.ok) {
        console.log('[ClientAuth] SignIn successful, waiting for session update...');
        // Session update will trigger redirect via useEffect
      }
    } catch (err: any) {
      console.error('[ClientAuth] Login failed:', err);
      setError('Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    setShowOTP(false);
    handleSendOTP();
  };

  if (status === 'loading') {
    console.log('[ClientAuth] Status is loading...');
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Client Sign In</h2>
          <p className='mt-2 text-sm text-gray-600'>Enter your email to receive a verification code</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Please verify your identity to continue</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showOTP ? (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
                <Button onClick={handleSendOTP} disabled={isLoading} className='w-full'>
                  {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Send Verification Code
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='otp'>Verification Code</Label>
                  <Input
                    id='otp'
                    type='text'
                    placeholder='Enter 6-digit code'
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    maxLength={6}
                  />
                </div>
                <div className='flex space-x-2'>
                  <Button onClick={handleLogin} disabled={isLoading} className='flex-1'>
                    {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Verify & Sign In
                  </Button>
                  <Button variant='outline' onClick={handleResendOTP} disabled={isLoading}>
                    Resend
                  </Button>
                </div>
                <p className='text-sm text-gray-600 text-center'>Code sent to {email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
