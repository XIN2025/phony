'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function InviteSuccessPage() {
  return (
    <div className='flex items-center justify-center min-h-[calc(100vh-200px)]'>
      <Card className='w-full max-w-md p-6'>
        <CardContent className='flex flex-col items-center justify-center p-10'>
          <div className='bg-muted rounded-full p-4 mb-6'>
            <CheckCircle2 className='w-16 h-16 text-green-500' />
          </div>
          <h1 className='text-3xl font-bold mb-2'>Invite Sent</h1>
          <p className='text-muted-foreground mb-8 text-center'>
            The invite has been sent to the client. They will receive an email shortly.
          </p>
          <Link href='/practitioner'>
            <Button className='px-8'>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
