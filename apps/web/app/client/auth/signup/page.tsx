'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Logo } from '@repo/ui/components/logo';
import { signOut, useSession } from 'next-auth/react';

interface LoggedInWarningProps {
  onLogout: () => void;
  practitionerName: string;
  isInvitationAccepted: boolean;
}

function LoggedInWarning({ onLogout, practitionerName, isInvitationAccepted }: LoggedInWarningProps) {
  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center pb-4'>
        <CardTitle className='text-xl sm:text-2xl'>Already Logged In</CardTitle>
        <CardDescription className='text-sm sm:text-base'>
          You are currently logged in as {practitionerName}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 sm:p-6'>
        <div className='space-y-4'>
          <p className='text-sm sm:text-base text-muted-foreground'>
            {isInvitationAccepted
              ? 'This invitation has already been accepted. You can log in with the client account.'
              : 'To accept this invitation, you need to log out of your practitioner account first.'}
          </p>
          <div className='space-y-3'>
            <Button onClick={onLogout} className='w-full'>
              {isInvitationAccepted ? 'Go to Login' : 'Logout and Continue'}
            </Button>
            <Button variant='outline' onClick={() => window.history.back()} className='w-full'>
              Go Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InvitationStatus {
  clientEmail: string;
  isAccepted: boolean;
}

export default function ClientSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { data: session, status } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    console.log('[Signup Page] useEffect triggered.', {
      token: token ? `${token.substring(0, 8)}...` : null,
      tokenLength: token?.length,
      status,
    });

    const fetchInvitationStatus = async () => {
      if (!token) {
        if (status === 'unauthenticated') {
          console.log('[Signup Page] No token found in URL.');
          setError('No invitation token found. Please use the link from your invitation email.');
        }
        return;
      }

      const decodedToken = decodeURIComponent(token);
      console.log(`[Signup Page] Fetching status for token: ${decodedToken.substring(0, 8)}...`);
      setIsLoading(true);
      try {
        const invitationData: InvitationStatus = await ApiClient.get(
          `/api/practitioner/invitations/token/${decodedToken}`,
        );
        console.log('[Signup Page] API call successful. Data:', invitationData);
        setInvitationStatus(invitationData);
        setEmail(invitationData.clientEmail);

        if (status === 'unauthenticated' && invitationData.isAccepted) {
          console.log('[Signup Page] Invite already accepted, redirecting to login.');
          toast.info('This invitation has already been accepted. Please log in.');
          router.push(`/client/auth?email=${encodeURIComponent(invitationData.clientEmail)}`);
        }
      } catch (err: unknown) {
        console.error('[Signup Page] API call failed. Full error object:', err);
        const errorMessage =
          (err as any)?.response?.data?.message ||
          (err as Error)?.message ||
          'This invitation link is invalid or has expired.';
        setError(errorMessage);
        setDetailedError(JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2));
        toast.error(errorMessage);
      } finally {
        console.log('[Signup Page] Fetch complete, setting loading to false.');
        setIsLoading(false);
      }
    };

    if (token && status !== 'loading') {
      fetchInvitationStatus();
    } else if (!token && status !== 'loading') {
      setError('No invitation token found. Please use the link from your invitation email.');
    }
  }, [searchParams, status, router, token]);

  const handleLogoutAndContinue = async () => {
    if (!invitationStatus) return;

    const callbackUrl = invitationStatus.isAccepted
      ? `/client/auth?email=${encodeURIComponent(invitationStatus.clientEmail)}`
      : window.location.href;

    await signOut({ redirect: true, callbackUrl });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || hasSubmitted) return;

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSubmitted(true);
    const toastId = toast.loading('Creating your account...');

    try {
      if (!token) throw new Error('Invitation token is missing.');

      // Decode the token if it's URL encoded
      const decodedToken = decodeURIComponent(token);

      await ApiClient.post('/api/auth/client/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        invitationToken: decodedToken,
      });

      toast.success('Account created successfully! Please log in to continue.', { id: toastId, duration: 5000 });

      const loginUrl = new URL('/client/auth', window.location.origin);
      loginUrl.searchParams.set('email', email.trim().toLowerCase());
      router.push(loginUrl.toString());
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.response?.data?.message || (err as Error)?.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || (isLoading && !invitationStatus)) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <Logo className='h-10 w-10 animate-pulse' />
      </div>
    );
  }

  // If logged in as a practitioner, show the correct warning dialog
  if (session?.user.role === 'PRACTITIONER' && invitationStatus) {
    return (
      <LoggedInWarning
        onLogout={handleLogoutAndContinue}
        practitionerName={session.user.name || 'Practitioner'}
        isInvitationAccepted={invitationStatus.isAccepted}
      />
    );
  }

  // If for some reason a client is already logged in and lands here.
  if (session?.user.role === 'CLIENT') {
    router.push('/client');
    return null;
  }

  if (error) {
    return (
      <Card className='w-full max-w-md mx-auto text-center'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-xl sm:text-2xl'>Error</CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6'>
          <p className='text-destructive text-sm sm:text-base'>{error}</p>
          {detailedError && (
            <div className='mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-left text-xs overflow-auto max-h-48'>
              <pre>
                <code>{detailedError}</code>
              </pre>
            </div>
          )}
          <div className='mt-6 space-y-3'>
            <Button onClick={() => router.push('/')} className='w-full'>
              Back to Home
            </Button>
            {token && (
              <Button
                variant='outline'
                onClick={async () => {
                  try {
                    const decodedToken = decodeURIComponent(token);
                    const debugResponse = await ApiClient.get(`/api/practitioner/invitations/debug/${decodedToken}`);
                    console.log('Debug response:', debugResponse);
                    alert('Check console for debug info');
                  } catch (err) {
                    console.error('Debug error:', err);
                    alert('Debug failed - check console');
                  }
                }}
                className='w-full'
              >
                Debug Token
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Final state: render the sign up form
  return (
    <Card className='w-full max-w-md mx-auto'>
      <form onSubmit={handleSignUp}>
        <CardHeader className='text-center pb-4'>
          <CardTitle className='text-xl sm:text-2xl'>Create Your Account</CardTitle>
          <CardDescription className='text-sm sm:text-base'>
            Welcome! Please confirm your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 p-4 sm:p-6'>
          {error && (
            <div className='p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md'>
              {error}
            </div>
          )}
          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter the email you were invited with'
                required
                value={email}
                readOnly
                className='cursor-not-allowed bg-muted/50 w-full'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-medium'>
                Full Name
              </Label>
              <Input
                id='name'
                placeholder='Your full name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading || hasSubmitted}
                className='w-full'
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className='p-4 sm:p-6 pt-0'>
          <Button
            type='submit'
            className='w-full'
            disabled={isLoading || hasSubmitted || !token || !name.trim() || !email.trim()}
          >
            {isLoading ? 'Creating Account...' : hasSubmitted ? 'Account Created!' : 'Create Account'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
