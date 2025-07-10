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
        <div className='flex items-center gap-3'>
          <Skeleton className='h-9 w-9 rounded-full' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
      );
    }
    const userName = getUserDisplayName(user);
    const userEmail = user?.email;
    const avatarUrl = getAvatarUrl(user?.avatarUrl, user);

    return (
      <button
        className='flex items-center gap-3 w-full text-left focus:outline-none rounded-lg p-1.5 cursor-pointer'
        onClick={() => {
          setSidebarOpen(false);
          router.push('/practitioner/settings');
        }}
        aria-label='View Profile'
        type='button'
      >
        <Avatar className='h-9 w-9 border'>
          <AvatarImage src={avatarUrl} alt={`${userName}'s avatar`} />
          <AvatarFallback>{getInitials({ firstName: user?.firstName, lastName: user?.lastName })}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <span className='font-semibold text-sm leading-tight'>{userName}</span>
          <span className='text-xs text-muted-foreground leading-tight'>{userEmail}</span>
        </div>
      </button>
    );
  };
  return (
    <div
      className='flex h-full flex-col font-sans'
      style={{ boxShadow: 'none', borderRight: 'none', background: 'transparent' }}
    >
      <div className='flex h-[64px] items-center px-8 mb-4'>
        <Link href='/' className='flex items-center gap-2 text-2xl font-logo font-semibold text-black'>
          <ContinuumIcon />
          <span>Continuum</span>
        </Link>
      </div>
      <div className='flex-1 py-2'>
        <nav className='grid items-start px-2 text-base gap-1'>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-full px-7 py-3 transition-all font-medium ${
                pathname === link.href
                  ? 'bg-[#807171] text-white font-semibold shadow-sm' // darker brown highlight
                  : 'text-[#a6a6a6] hover:text-black hover:bg-[#ede6e3]'
              }`}
              style={{ minHeight: 44, justifyContent: 'flex-start' }}
            >
              <link.icon className='h-5 w-5' />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className='border-t border-[#e5d6d0] mt-auto px-8 pb-4 pt-6 flex flex-col gap-3'>
        <div className='flex items-center gap-3'>
          <UserProfile />
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start gap-2 text-[#a6a6a6] hover:text-black'
          onClick={() => signOut({ callbackUrl: signOutCallbackUrl })}
        >
          <LogOut className='h-4 w-4' />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
