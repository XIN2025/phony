'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { Loader2, AlertTriangle, LogOut, User } from 'lucide-react';
import { clearAllAuthData } from '@/lib/auth-utils';
import { useGetInvitationByToken, useClientSignup } from '@/lib/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';

export default function ClientSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { status, data: session } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  const { data: invitationData, isLoading, error } = useGetInvitationByToken(token || '');
  const { mutate: handleSignup, isPending: isSigningUp } = useClientSignup();

  useEffect(() => {
    if (invitationData) {
      setEmail(invitationData.clientEmail);
      if (invitationData.isAccepted) {
        toast.info('This invitation has already been accepted. Please log in.');
        router.push(`/client/auth?email=${encodeURIComponent(invitationData.clientEmail)}`);
      }
    }
  }, [invitationData, router]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'This invitation link is invalid or has expired.';
      toast.error(errorMessage);
    }
  }, [error]);

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
    } catch {
      setIsLoggingOut(false);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const toastId = toast.loading('Creating your account...');

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('firstName', firstName.trim());
    formData.append('lastName', lastName.trim());
    formData.append('email', email!.trim().toLowerCase());
    formData.append('invitationToken', token!);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    handleSignup(formData, {
      onSuccess: () => {
        toast.success('Account created successfully! Please log in to continue.', { id: toastId });
        router.push(`/client/auth?email=${encodeURIComponent(email!.trim().toLowerCase())}`);
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.', { id: toastId });
      },
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  // Handle authenticated users - show different messages based on role
  if (status === 'authenticated' && session) {
    if (session.user.role === 'PRACTITIONER') {
      return (
        <div className='text-center max-w-md mx-auto p-6'>
          <AlertTriangle className='h-12 w-12 text-amber-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2'>Practitioner Account Detected</h2>
          <p className='text-muted-foreground mb-4'>
            You are currently logged in as a practitioner. To accept this client invitation, you need to log out of your
            practitioner account first.
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
      );
    } else if (session.user.role === 'CLIENT') {
      return (
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
      );
    }
  }

  if (error) {
    return (
      <div className='text-center max-w-md mx-auto p-6'>
        <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
        <h2 className='text-xl font-semibold mb-2'>Error</h2>
        <p className='text-muted-foreground mb-4'>{error.message}</p>
        <Button onClick={() => router.push('/')} className='w-full'>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!email) {
    return (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold tracking-tight'>Welcome to Continuum</h1>
          <p className='text-muted-foreground'>Please confirm your details to create your account.</p>
        </div>
        <form onSubmit={handleSignUp} className='space-y-4'>
          <div className='flex justify-center'>
            <div className='relative'>
              <label htmlFor='profile-photo-upload' className='cursor-pointer'>
                {profileImagePreview ? (
                  <Avatar className='h-20 w-20'>
                    <AvatarImage src={profileImagePreview} alt='Profile Photo' />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className='h-20 w-20 border border-dashed'>
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
                <input
                  id='profile-photo-upload'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleProfileImageChange}
                />
                <span className='block text-xs text-muted-foreground mt-2 text-center'>Profile Photo (Optional)</span>
              </label>
            </div>
          </div>
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
            <Input id='email' type='email' value={email} disabled className='bg-muted' />
            <p className='text-xs text-muted-foreground mt-1'>
              This email was provided in your invitation and cannot be changed.
            </p>
          </div>
          <Button type='submit' className='w-full' disabled={isSigningUp}>
            {isSigningUp && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Account
          </Button>
        </form>
      </div>
    </>
  );
}
