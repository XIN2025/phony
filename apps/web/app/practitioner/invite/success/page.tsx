'use client';

import { useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInviteContext } from '@/context/InviteContext';

export default function InviteSuccessPage() {
  const router = useRouter();
  const { resetInviteFlow } = useInviteContext();

  // Reset the flow when the user lands on this page.
  useEffect(() => {
    resetInviteFlow();
  }, [resetInviteFlow]);

  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle2 className='h-10 w-10 text-green-600' />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <h1 className='text-2xl font-bold'>Invite Sent!</h1>
          <p className='text-muted-foreground'>
            Your client has been sent an email with a unique link to join the platform. You can check the status of your
            invitations on the dashboard.
          </p>
          <div className='flex justify-center gap-4 pt-4'>
            <Button asChild>
              <Link href='/practitioner'>Back to Dashboard</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/practitioner/invite'>Invite Another Client</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
