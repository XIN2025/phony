'use client';
import Link from 'next/link';
import Image from 'next/image';
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
  <Image src='/Continuum.svg' alt='Continuum Logo' width={120} height={32} className='h-8 w-auto' />
);

// SVG icon components that use the actual SVG files and can change color
const HomeIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
    <path d='M12 18V15' stroke={isActive ? '#FDF9F5' : '#807171'} strokeLinecap='round' strokeLinejoin='round' />
    <path
      d='M10.0732 2.81985L3.14319 8.36985C2.36319 8.98985 1.86319 10.2998 2.03319 11.2798L3.36319 19.2398C3.60319 20.6598 4.96319 21.8098 6.40319 21.8098H17.6032C19.0332 21.8098 20.4032 20.6498 20.6432 19.2398L21.9732 11.2798C22.1332 10.2998 21.6332 8.98985 20.8632 8.36985L13.9332 2.82985C12.8632 1.96985 11.1332 1.96985 10.0732 2.81985Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const ClientsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
    <path
      d='M9.15957 10.87C9.05957 10.86 8.93957 10.86 8.82957 10.87C6.44957 10.79 4.55957 8.84 4.55957 6.44C4.55957 3.99 6.53957 2 8.99957 2C11.4496 2 13.4396 3.99 13.4396 6.44C13.4296 8.84 11.5396 10.79 9.15957 10.87Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M16.4103 4C18.3503 4 19.9103 5.57 19.9103 7.5C19.9103 9.39 18.4103 10.93 16.5403 11C16.4603 10.99 16.3703 10.99 16.2803 11'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4.15973 14.56C1.73973 16.18 1.73973 18.82 4.15973 20.43C6.90973 22.27 11.4197 22.27 14.1697 20.43C16.5897 18.81 16.5897 16.17 14.1697 14.56C11.4297 12.73 6.91973 12.73 4.15973 14.56Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M18.3398 20C19.0598 19.85 19.7398 19.56 20.2998 19.13C21.8598 17.96 21.8598 16.03 20.2998 14.86C19.7498 14.44 19.0798 14.16 18.3698 14'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const MessagesIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
    <path
      d='M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeMiterlimit='10'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M15.9965 11H16.0054'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M11.9955 11H12.0045'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M7.99451 11H8.00349'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const JournalsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
    <path
      d='M21.6602 10.44L20.6802 14.62C19.8402 18.23 18.1802 19.69 15.0602 19.39C14.5602 19.35 14.0202 19.26 13.4402 19.12L11.7602 18.72C7.59018 17.73 6.30018 15.67 7.28018 11.49L8.26018 7.30001C8.46018 6.45001 8.70018 5.71001 9.00018 5.10001C10.1702 2.68001 12.1602 2.03001 15.5002 2.82001L17.1702 3.21001C21.3602 4.19001 22.6402 6.26001 21.6602 10.44Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M15.0603 19.3901C14.4403 19.8101 13.6603 20.1601 12.7103 20.4701L11.1303 20.9901C7.16034 22.2701 5.07034 21.2001 3.78034 17.2301L2.50034 13.2801C1.22034 9.3101 2.28034 7.2101 6.25034 5.9301L7.83034 5.4101C8.24034 5.2801 8.63034 5.1701 9.00034 5.1001C8.70034 5.7101 8.46034 6.4501 8.26034 7.3001L7.28034 11.4901C6.30034 15.6701 7.59034 17.7301 11.7603 18.7201L13.4403 19.1201C14.0203 19.2601 14.5603 19.3501 15.0603 19.3901Z'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12.6396 8.52979L17.4896 9.75979'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M11.6602 12.3999L14.5602 13.1399'
      stroke={isActive ? '#FDF9F5' : '#807171'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const SidebarContent = ({
  navLinks,
  pathname,
  signOutCallbackUrl = '/practitioner/auth',
  settingsPath = '/practitioner/settings',
  homePath = '/',
}: {
  navLinks: Array<{ href: string; icon: React.ElementType; label: string }>;
  pathname: string;
  signOutCallbackUrl?: string;
  settingsPath?: string;
  homePath?: string;
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
    <div className='flex h-full flex-col font-sans bg-white lg:bg-transparent shadow-lg sm:shadow-none border-r sm:border-none min-w-0 rounded-bl-2xl'>
      <div className='flex h-[56px] sm:h-[64px] lg:h-[68px] items-center px-6 sm:px-8 lg:px-8 xl:px-10 mb-4 sm:mb-6 lg:mb-8'>
        <Link
          href={homePath}
          className='flex items-center justify-start text-xl sm:text-2xl font-logo font-semibold text-black min-w-0'
        >
          <ContinuumIcon />
        </Link>
      </div>
      <div className='flex-1 py-2 lg:py-4 min-w-0'>
        <nav className='grid items-start px-4 lg:px-6 text-sm sm:text-base lg:text-lg gap-2 '>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 sm:gap-4 lg:gap-5 rounded-full px-4 sm:px-6 lg:px-8 xl:px-12 py-2 transition-all font-medium text-sm sm:text-base lg:text-lg ${
                  isActive
                    ? 'bg-[#807171] text-[#FDF9F5] font-semibold shadow-sm'
                    : 'text-[#807171] hover:text-black hover:bg-[#ede6e3]'
                }`}
                style={{ minHeight: 40, justifyContent: 'flex-start' }}
              >
                <link.icon className='h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0' isActive={isActive} />
                <span className='truncate'>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className='border-t border-[#e5d6d0] mt-auto px-6 sm:px-8 lg:px-8 xl:px-10 pb-4 sm:pb-6 lg:pb-8 pt-4 sm:pt-6 lg:pt-8 flex flex-col gap-3 sm:gap-4 lg:gap-4 min-w-0'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <UserProfile />
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start gap-2 lg:gap-3 text-[#807171] hover:text-black text-sm sm:text-base lg:text-lg'
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className='h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0' />
          <span className='truncate'>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

// Export the custom icons for use in layout files
export { HomeIcon, ClientsIcon, MessagesIcon, JournalsIcon };
