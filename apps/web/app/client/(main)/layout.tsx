'use client';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useClientAuth } from '@/lib/hooks/use-client-auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { Book, Home, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ClientLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useClientAuth();

  const navLinks = [
    { href: '/client', icon: Home, label: 'Home' },
    { href: '/client/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/client/journals', icon: Book, label: 'Journals' },
  ];

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
    <div className='relative min-h-screen w-full max-w-full overflow-x-hidden'>
      {/* Gradient background - matching practitioner style */}
      <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />

      <div className='relative z-20 grid min-h-screen w-full lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]'>
        <div className='hidden bg-transparent lg:block'>
          <SidebarContent
            navLinks={navLinks}
            pathname={pathname}
            signOutCallbackUrl='/'
            settingsPath='/client/settings'
          />
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side='left'
            className='w-[70vw] max-w-xs sm:w-[280px] sm:max-w-sm md:w-[320px] p-0 bg-transparent'
          >
            <SheetHeader className='sr-only'>
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent
              navLinks={navLinks}
              pathname={pathname}
              signOutCallbackUrl='/'
              settingsPath='/client/settings'
            />
          </SheetContent>
        </Sheet>
        <div className='flex flex-1 flex-col min-w-0'>
          <main className='flex-1 flex justify-center items-start bg-transparent min-w-0'>
            <div className='w-full min-w-0'>{children}</div>
          </main>
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
