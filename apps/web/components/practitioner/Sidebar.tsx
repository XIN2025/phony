'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { getInitials } from '@/lib/utils';

const ContinuumIcon = () => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='h-6 w-6'>
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' stroke='currentColor' strokeWidth='2' />
    <path
      d='M12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
    />
  </svg>
);

export const SidebarContent = ({
  navLinks,
  pathname,
  userName,
}: {
  navLinks: Array<{ href: string; icon: React.ElementType; label: string }>;
  pathname: string;
  userName: string;
}) => (
  <div className='flex h-full flex-col'>
    <div className='flex h-[60px] items-center px-6'>
      <Link href='/' className='flex items-center gap-2 text-lg font-logo font-semibold'>
        <ContinuumIcon />
        <span>Continuum</span>
      </Link>
    </div>
    <div className='flex-1 py-2'>
      <nav className='grid items-start px-4 text-base'>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all ${
              pathname === link.href
                ? 'border border-gray-700 bg-white font-semibold text-black shadow-sm'
                : 'font-medium text-gray-500 hover:text-black'
            }`}
          >
            <link.icon className='h-5 w-5' />
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
    <div className='mt-auto p-4'>
      <div className='flex items-center gap-3 mb-3'>
        <Avatar className='h-9 w-9 border'>
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <span className='font-semibold text-sm'>{userName}</span>
        </div>
      </div>
      <Button
        variant='outline'
        size='sm'
        className='w-full justify-start gap-2 text-gray-600 hover:text-black'
        onClick={() => signOut({ callbackUrl: '/practitioner/auth' })}
      >
        <LogOut className='h-4 w-4' />
        Sign Out
      </Button>
    </div>
  </div>
);
