'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { Logo } from '@repo/ui/components/logo';
import { clearAllAuthData } from '@/lib/auth-utils';

interface InvitationStatus {
  clientEmail: string;
  isAccepted: boolean;
}

export default function ClientSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { status, data: session } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchInvitationStatus = async () => {
      if (!token) {
        setError('No invitation token found. Please use the link from your invitation email.');
        setIsLoading(false);
        return;
      }
      try {
        const invitationData: InvitationStatus = await ApiClient.get(`/api/practitioner/invitations/token/${token}`);
        setEmail(invitationData.clientEmail);
        if (invitationData.isAccepted) {
          toast.info('This invitation has already been accepted. Please log in.');
          router.push(`/client/auth?email=${encodeURIComponent(invitationData.clientEmail)}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'This invitation link is invalid or has expired.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchInvitationStatus();
    }
  }, [token, router]);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear all authentication data first
      await clearAllAuthData();
      // Then sign out from NextAuth
      await signOut({
        redirect: false,
        callbackUrl: `/client/auth/signup?token=${encodeURIComponent(token || '')}`,
      });
      // Force page reload to clear any cached session data
      window.location.href = `/client/auth/signup?token=${encodeURIComponent(token || '')}`;
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      toast.error('Failed to log out. Please try again.');
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating your account...');
    try {
      const signupData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email!.trim().toLowerCase(),
        invitationToken: token!,
      };

      const response: unknown = await ApiClient.post('/api/auth/client/signup', signupData);

      toast.success('Account created successfully! Please log in to continue.', { id: toastId });

      // Redirect to login page with the email pre-filled
      router.push(`/client/auth?email=${encodeURIComponent(email!.trim().toLowerCase())}`);
    } catch (err: unknown) {
      console.error('Signup error:', err);
      console.error('Error response:', err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.', { id: toastId });
      setIsSubmitting(false);
    }
  };
  if (status === 'loading' || isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-sm text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }
  // Handle authenticated users - show different messages based on role
  if (status === 'authenticated' && session) {
    if (session.user.role === 'PRACTITIONER') {
      return (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center max-w-md mx-auto p-6'>
            <AlertTriangle className='h-12 w-12 text-amber-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Practitioner Account Detected</h2>
            <p className='text-muted-foreground mb-4'>
              You are currently logged in as a practitioner. To accept this client invitation, you need to log out of
              your practitioner account first.
            </p>
            <div className='space-y-2'>
              <Button onClick={handleLogout} className='w-full' disabled={isLoggingOut}>
                {isLoggingOut && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                <LogOut className='mr-2 h-4 w-4' />
                {isLoggingOut ? 'Logging Out...' : 'Log Out as Practitioner'}
              </Button>
              <Button variant='outline' onClick={() => router.push('/practitioner')} className='w-full'>
                Back to Practitioner Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (session.user.role === 'CLIENT') {
      return (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center max-w-md mx-auto p-6'>
            <AlertTriangle className='h-12 w-12 text-blue-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Already Logged In</h2>
            <p className='text-muted-foreground mb-4'>
              You are already logged in as a client. If you want to accept this invitation with a different account,
              please log out first.
            </p>
            <div className='space-y-2'>
              <Button onClick={handleLogout} className='w-full' disabled={isLoggingOut}>
                {isLoggingOut && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                <LogOut className='mr-2 h-4 w-4' />
                {isLoggingOut ? 'Logging Out...' : 'Log Out'}
              </Button>
              <Button variant='outline' onClick={() => router.push('/client')} className='w-full'>
                Back to Client Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }
  if (error) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2'>Error</h2>
          <p className='text-muted-foreground mb-4'>{error}</p>
          <Button onClick={() => router.push('/')} className='w-full'>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  if (!email) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }
  return (
    <>
      <div className='mb-8 text-center'>
        <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
      </div>
      <div className='space-y-6'>
        <div className='text-left'>
          <h1 className='text-2xl font-bold tracking-tight'>Welcome to Continuum</h1>
          <p className='text-muted-foreground'>Please confirm your details to create your account.</p>
        </div>
        <form onSubmit={handleSignUp} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='first-name'>First Name</Label>
              <Input
                id='first-name'
                placeholder='Your first name'
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='last-name'>Last Name</Label>
              <Input
                id='last-name'
                placeholder='Your last name'
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor='email'>Email Address</Label>
            <Input id='email' type='email' value={email || ''} disabled />
          </div>
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </>
  );
}
