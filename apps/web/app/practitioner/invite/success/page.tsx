'use client';
import { Card } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function InviteSuccessPage() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-transparent'>
      <div className='flex flex-col items-center'>
        <div className='flex items-center justify-center mb-6'>
          <span className='flex items-center justify-center rounded-full bg-[#b7a9a3]/30 h-16 w-16'>
            <CheckCircle className='h-10 w-10 text-[#b7a9a3]' />
          </span>
        </div>
        <h1 className='text-2xl font-semibold mb-8 text-center'>Invite Sent!</h1>
        <Link href='/practitioner'>
          <Button className='rounded-full px-10 py-2 bg-black text-white text-base font-medium w-72 mx-auto'>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
