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
  <Image src='/continuum.png' alt='Continuum Logo' width={120} height={32} className='h-8 w-auto' />
);

// Custom icon components using images from public/sidebar
const HomeIcon = ({ className }: { className?: string }) => (
  <Image src='/sidebar/home.png' alt='Home' width={16} height={16} className={className} />
);

const ClientsIcon = ({ className }: { className?: string }) => (
  <Image src='/sidebar/profile-2user.png' alt='Clients' width={16} height={16} className={className} />
);

const MessagesIcon = ({ className }: { className?: string }) => (
  <Image src='/sidebar/message.png' alt='Messages' width={16} height={16} className={className} />
);

const JournalsIcon = ({ className }: { className?: string }) => (
  <Image src='/sidebar/note-2.png' alt='Journals' width={16} height={16} className={className} />
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
    <div className='flex h-full flex-col font-sans bg-white lg:bg-transparent shadow-lg sm:shadow-none border-r sm:border-none min-w-0 rounded-bl-2xl'>
      <div className='flex h-[56px] sm:h-[64px] lg:h-[68px] items-center px-6 sm:px-8 lg:px-8 xl:px-10 mb-4 sm:mb-6 lg:mb-8'>
        <Link
          href='/'
          className='flex items-center justify-start text-xl sm:text-2xl font-logo font-semibold text-black min-w-0'
        >
          <ContinuumIcon />
        </Link>
      </div>
      <div className='flex-1 py-2 lg:py-4 min-w-0'>
        <nav className='grid items-start px-4 lg:px-6 text-sm sm:text-base lg:text-base gap-2 lg:gap-3'>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 sm:gap-4 lg:gap-4 rounded-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-3 lg:py-4 transition-all font-medium text-sm sm:text-base lg:text-base ${
                pathname === link.href
                  ? 'bg-[#807171] text-white font-semibold shadow-sm' // Updated color to #807171
                  : 'text-[#807171] hover:text-black hover:bg-[#ede6e3]'
              }`}
              style={{ minHeight: 40, justifyContent: 'flex-start' }}
            >
              <link.icon className='h-5 w-5 sm:h-5 sm:w-5 lg:h-5 lg:w-5 flex-shrink-0' />
              <span className='truncate'>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className='border-t border-[#e5d6d0] mt-auto px-6 sm:px-8 lg:px-8 xl:px-10 pb-4 sm:pb-6 lg:pb-8 pt-4 sm:pt-6 lg:pt-8 flex flex-col gap-3 sm:gap-4 lg:gap-4 min-w-0'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <UserProfile />
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start gap-2 lg:gap-2.5 text-[#807171] hover:text-black text-sm sm:text-base lg:text-base'
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className='h-4 w-4 lg:h-4.5 lg:w-4.5 flex-shrink-0' />
          <span className='truncate'>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

// Export the custom icons for use in layout files
export { HomeIcon, ClientsIcon, MessagesIcon, JournalsIcon };
