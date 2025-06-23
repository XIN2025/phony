'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@repo/ui/components/logo';

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
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'This invitation link is invalid or has expired.';
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

  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('Client signup: User is authenticated, signing out...');

      signOut({
        redirect: false,
        callbackUrl: `/client/auth/signup?token=${encodeURIComponent(token || '')}`,
      }).then(() => {
        window.location.href = `/client/auth/signup?token=${encodeURIComponent(token || '')}`;
      });
    }
  }, [status, session, token]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating your account...');

    try {
      await ApiClient.post('/api/auth/client/signup', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email!.trim().toLowerCase(),
        invitationToken: token!,
      });

      toast.success('Account created successfully! Please log in to continue.', { id: toastId });
      router.push(`/client/auth?email=${encodeURIComponent(email!)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An unexpected error occurred.', { id: toastId });
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

  if (status === 'authenticated') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
        <p className='text-sm text-muted-foreground'>Signing you out...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center'>
        <h2 className='text-xl font-semibold'>Error</h2>
        <p className='text-destructive mt-2'>{error}</p>
        <Button onClick={() => router.push('/')} className='mt-4'>
          Back to Home
        </Button>
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
