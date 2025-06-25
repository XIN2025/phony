'use client';
import { Card } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function InviteSuccessPage() {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <Card className='w-full max-w-md p-6 text-center'>
        <div className='mb-6'>
          <CheckCircle className='mx-auto h-16 w-16 text-green-500 mb-4' />
          <h1 className='text-2xl font-bold mb-2'>Invitation Sent!</h1>
          <p className='text-muted-foreground'>
            Your client has been invited successfully. They will receive an email with instructions to join the
            platform.
          </p>
        </div>
        <div className='space-y-3'>
          <Link href='/practitioner/invite'>
            <Button className='w-full'>Invite Another Client</Button>
          </Link>
          <Link href='/practitioner'>
            <Button variant='outline' className='w-full'>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
