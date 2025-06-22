'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useInviteContext } from '@/context/InviteContext';

export default function InviteSuccessPage() {
  const { resetInviteFlow } = useInviteContext();

  useEffect(() => {
    resetInviteFlow();
  }, [resetInviteFlow]);

  return (
    <div className='flex min-h-[80vh] items-center justify-center'>
      <Card className='w-full max-w-md text-center shadow-lg'>
        <CardHeader className='items-center'>
          <CheckCircle2 className='h-16 w-16 text-green-500' />
          <CardTitle className='mt-4 text-2xl font-semibold'>Invitation Sent!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Your client has been sent an invitation to join you on Continuum. You can track the status of your
            invitation on your dashboard.
          </p>
          <div className='mt-6 flex justify-center gap-4'>
            <Link href='/practitioner' passHref>
              <Button>Go to Dashboard</Button>
            </Link>
            <Link href='/practitioner/invite' passHref>
              <Button variant='outline'>Invite Another Client</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
