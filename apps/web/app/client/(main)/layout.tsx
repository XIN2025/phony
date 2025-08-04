'use client';
import { SidebarContent, HomeIcon, MessagesIcon, JournalsIcon } from '@/components/practitioner/Sidebar';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useClientAuth } from '@/lib/hooks/use-client-auth';
import { usePathname } from 'next/navigation';
import { ClientBottomNavigation } from '@/components/client/BottomNavigation';
import { ClientHeader } from '@/components/client/ClientHeader';

const ClientLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useClientAuth();

  const navLinks = [
    { href: '/client', icon: HomeIcon, label: 'Home' },
    { href: '/client/messages', icon: MessagesIcon, label: 'Messages' },
    { href: '/client/journals', icon: JournalsIcon, label: 'Journals' },
  ];

  // Check if we're on the messages page
  const isMessagesPage = pathname === '/client/messages';

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-sm text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-sm text-muted-foreground'>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen w-full max-w-full ${isMessagesPage ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
      {/* Gradient background - matching practitioner style */}
      <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />

      <div
        className={`relative z-20 grid h-screen w-full ${sidebarOpen ? 'lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] 2xl:grid-cols-[360px_1fr]' : 'lg:grid-cols-[80px_1fr]'}`}
      >
        <div className='hidden lg:block h-full transition-all duration-300'>
          <SidebarContent
            navLinks={navLinks}
            pathname={pathname}
            signOutCallbackUrl='/'
            settingsPath='/client/settings'
            homePath='/client'
            sidebarOpen={sidebarOpen}
          />
        </div>
        <div className='flex flex-1 flex-col min-w-0 h-screen'>
          {/* Fixed header for mobile only */}
          <div className='lg:hidden'>
            <ClientHeader />
          </div>

          <main className='flex-1 flex justify-center items-start  bg-transparent min-w-0 pb-16 lg:pb-0 overflow-y-auto'>
            <div className='w-full min-w-0'>{children}</div>
          </main>
          <ClientBottomNavigation />
        </div>
      </div>
    </div>
  );
};

export default function ClientMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className='min-h-screen w-full font-sans'>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </div>
    </SidebarProvider>
  );
}
