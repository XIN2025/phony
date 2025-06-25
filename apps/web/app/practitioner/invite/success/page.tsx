'use client';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useInviteContext } from '@/context/InviteContext';
import { useQueryClient } from '@tanstack/react-query';

export default function InviteSuccessPage() {
  const { resetInviteFlow } = useInviteContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    resetInviteFlow();
    queryClient.invalidateQueries({ queryKey: ['invitations'] });
  }, [resetInviteFlow, queryClient]);

  const handleGoToDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['invitations'] });
    router.push('/practitioner');
  };

  return (
    <div className='flex min-h-[80vh] items-center justify-center'>
      <Card className='w-full max-w-md text-center shadow-lg'>
        <div className='flex flex-col items-center justify-center p-6'>
          <CheckCircle2 className='h-16 w-16 text-green-500 mb-4' />
          <h2 className='text-2xl font-semibold mb-4'>Invitation Sent!</h2>
          <p className='text-muted-foreground mb-6'>
            Your client has been sent an invitation to join you on Continuum. You can track the status of your
            invitation on your dashboard.
          </p>
          <div className='flex justify-center gap-4'>
            <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
            <Link href='/practitioner/invite' passHref>
              <Button variant='outline'>Invite Another Client</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
