'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { getAvatarUrl, getUserDisplayName, getInitials } from '@/lib/utils';

export const PractitionerHeader = () => {
  const { data: currentUser } = useGetCurrentUser();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    router.push('/practitioner');
  };

  return (
    <div
      className={`sticky top-0 z-90 lg:hidden transition-colors duration-200 ${
        scrolled ? 'bg-pink-50 shadow backdrop-blur-xl' : 'bg-white/20 backdrop-blur-xl'
      }`}
    >
      <div className='flex items-center justify-between px-4 py-3'>
        <div className='flex items-center'>
          <button onClick={handleLogoClick} className='block cursor-pointer hover:opacity-80 transition-opacity'>
            <Image src='/Continuum.svg' alt='Continuum' width={120} height={32} className='h-6 w-auto' />
          </button>
        </div>
        <Link href='/practitioner/settings'>
          <Avatar className='h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity'>
            <AvatarImage
              src={getAvatarUrl(currentUser?.avatarUrl, currentUser)}
              alt={getUserDisplayName(currentUser) || 'User'}
            />
            <AvatarFallback>{getInitials(currentUser || 'U')}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
};
