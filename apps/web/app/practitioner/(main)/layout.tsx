'use client';

import Link from 'next/link';
import { Home, Users, File as FileIcon, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { getUserDisplayName } from '@/lib/utils';
import { useEffect } from 'react';
import { Button } from '@repo/ui/components/button';

export default function PractitionerMainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/practitioner/auth');
      return;
    }

    if (session?.user?.role !== 'PRACTITIONER') {
      if (session?.user?.role === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/practitioner/auth');
      }
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Not authenticated</h2>
          <p className='text-sm text-gray-600 mb-4'>Please sign in to access the practitioner dashboard</p>
          <Button onClick={() => router.push('/practitioner/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'PRACTITIONER') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Access Denied</h2>
          <p className='text-sm text-gray-600 mb-4'>You don't have permission to access the practitioner dashboard</p>
          <Button onClick={() => router.push('/client')}>Go to Client Dashboard</Button>
        </div>
      </div>
    );
  }

  const userName = getUserDisplayName(session);
  const navLinks = [
    { href: '/practitioner', icon: Home, label: 'Home' },
    { href: '/practitioner/clients', icon: Users, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/practitioner/forms', icon: FileIcon, label: 'Forms' },
  ];

  return (
    <div className='grid h-screen w-full lg:grid-cols-[280px_1fr]'>
      <div className='hidden bg-gray-50/40 lg:block'>
        <SidebarContent navLinks={navLinks} pathname={pathname} userName={userName} />
      </div>
      <div className='flex flex-col'>
        <main className='flex flex-1 flex-col gap-4 overflow-auto bg-gray-50/40 p-4 md:p-8'>{children}</main>
      </div>
    </div>
  );
}
