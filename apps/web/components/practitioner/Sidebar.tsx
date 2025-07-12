'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { getUserDisplayName, getAvatarUrl, getInitials } from '@/lib/utils';
import { Skeleton } from '@repo/ui/components/skeleton';
import { useSidebar } from '@/context/SidebarContext';
import { useRouter } from 'next/navigation';
import { useGetCurrentUser } from '@/lib/hooks/use-api';

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
  signOutCallbackUrl = '/practitioner/auth',
  settingsPath = '/practitioner/settings',
}: {
  navLinks: Array<{ href: string; icon: React.ElementType; label: string }>;
  pathname: string;
  signOutCallbackUrl?: string;
  settingsPath?: string;
}) => {
  const { setSidebarOpen } = useSidebar();
  const { data: user, isLoading } = useGetCurrentUser();
  const router = useRouter();
  const UserProfile = () => {
    if (isLoading) {
      return (
        <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
          <Skeleton className='h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0' />
          <div className='flex flex-col gap-1 min-w-0 flex-1'>
            <Skeleton className='h-3 w-20 sm:w-24' />
            <Skeleton className='h-2 w-16 sm:w-20' />
          </div>
        </div>
      );
    }
    const userName = getUserDisplayName(user);
    const userEmail = user?.email;
    const avatarUrl = getAvatarUrl(user?.avatarUrl, user);

    return (
      <button
        className='flex items-center gap-2 sm:gap-3 w-full text-left focus:outline-none rounded-lg p-1.5 cursor-pointer min-w-0'
        onClick={() => {
          setSidebarOpen(false);
          router.push(settingsPath);
        }}
        aria-label='View Profile'
        type='button'
      >
        <Avatar className='h-8 w-8 sm:h-9 sm:w-9 border flex-shrink-0'>
          <AvatarImage src={avatarUrl} alt={`${userName}'s avatar`} />
          <AvatarFallback className='text-xs sm:text-sm'>
            {getInitials({ firstName: user?.firstName, lastName: user?.lastName })}
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-col min-w-0 flex-1'>
          <span className='font-semibold text-xs sm:text-sm leading-tight truncate'>{userName}</span>
          <span className='text-xs text-muted-foreground leading-tight truncate'>{userEmail}</span>
        </div>
      </button>
    );
  };
  return (
    <div className='flex h-full flex-col font-sans bg-white lg:bg-transparent shadow-lg sm:shadow-none border-r sm:border-none min-w-0'>
      <div className='flex h-[56px] sm:h-[64px] items-center px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4'>
        <Link
          href='/'
          className='flex items-center gap-2 text-xl sm:text-2xl font-logo font-semibold text-black min-w-0'
        >
          <ContinuumIcon />
          <span className='truncate'>Continuum</span>
        </Link>
      </div>
      <div className='flex-1 py-2 min-w-0'>
        <nav className='grid items-start px-2 text-sm sm:text-base gap-1'>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 sm:gap-3 rounded-full px-4 sm:px-7 py-2 sm:py-3 transition-all font-medium text-sm sm:text-base ${
                pathname === link.href
                  ? 'bg-[#807171] text-white font-semibold shadow-sm' // darker brown highlight
                  : 'text-[#a6a6a6] hover:text-black hover:bg-[#ede6e3]'
              }`}
              style={{ minHeight: 40, justifyContent: 'flex-start' }}
            >
              <link.icon className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
              <span className='truncate'>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className='border-t border-[#e5d6d0] mt-auto px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 pt-4 sm:pt-6 flex flex-col gap-2 sm:gap-3 min-w-0'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <UserProfile />
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start gap-2 text-[#a6a6a6] hover:text-black text-sm sm:text-base'
          onClick={() => signOut({ callbackUrl: signOutCallbackUrl })}
        >
          <LogOut className='h-4 w-4 flex-shrink-0' />
          <span className='truncate'>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
