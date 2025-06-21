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
  const title = isInvitationAccepted ? 'Invitation Already Accepted' : 'Accepting a Client Invitation';
  const description = isInvitationAccepted
    ? `You are logged in as ${practitionerName}. The invitation for this client has already been accepted. To continue, you can log out and sign in to the client's account.`
    : `You are currently logged in as ${practitionerName}. This invitation is for a new Client account. To proceed, you will be logged out of your practitioner account first.`;
  const buttonText = isInvitationAccepted ? 'Log Out & Continue to Log In' : 'Log Out & Continue to Sign Up';

  return (
    <Card className='w-full max-w-md text-center'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold'>{title}</CardTitle>
        <CardDescription className='pt-2'>{description}</CardDescription>
      </CardHeader>
      <CardFooter className='flex flex-col gap-2'>
        <Button onClick={onLogout} className='w-full'>
          {buttonText}
        </Button>
        <Button onClick={() => (window.location.href = '/practitioner')} variant='outline' className='w-full'>
          Cancel and Return to Dashboard
        </Button>
      </CardFooter>
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
      <div className='flex min-h-screen flex-col items-center justify-center'>
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
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-destructive'>{error}</p>
          {detailedError && (
            <div className='mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-left text-xs overflow-auto max-h-48'>
              <pre>
                <code>{detailedError}</code>
              </pre>
            </div>
          )}
          <div className='mt-4 space-y-2'>
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
    <Card className='w-full'>
      <form onSubmit={handleSignUp}>
        <CardHeader>
          <CardTitle className='text-2xl'>Create Your Account</CardTitle>
          <CardDescription>Welcome! Please confirm your details to get started.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <div className='p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md'>
              {error}
            </div>
          )}
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='Enter the email you were invited with'
              required
              value={email}
              readOnly
              className='cursor-not-allowed bg-muted/50'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='name'>Full Name</Label>
            <Input
              id='name'
              placeholder='Your full name'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || hasSubmitted}
            />
          </div>
        </CardContent>
        <CardFooter>
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
