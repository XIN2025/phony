'use client';

import Link from 'next/link';
import { Home, Users, File as FileIcon, MessageSquare } from 'lucide-react';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';

export default function PractitionerMainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? 'Ana Johnson';
  const pathname = usePathname();

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
