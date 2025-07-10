'use client';
import { Home, MessageSquare, Menu, Book } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarContent as PractitionerSidebarContent } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';
import { useClientAuth } from '@/lib/hooks/use-client-auth';

const ClientLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useClientAuth();

  const navLinks = [
    { href: '/client', icon: Home, label: 'Home' },
    { href: '/client/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/client/journals', icon: Book, label: 'Journals' },
  ];

  // Show loading state during authentication checks
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

  // Don't render anything if not authenticated (hook will handle redirects)
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
    <div className='relative min-h-screen w-full'>
      {/* Simple background for main client area */}
      <div className='absolute inset-0 z-0 bg-background' />
      <div className='relative z-20 grid min-h-screen w-full lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]'>
        <div className='hidden bg-transparent lg:block'>
          <PractitionerSidebarContent
            navLinks={navLinks}
            pathname={pathname}
            signOutCallbackUrl='/client/auth'
            settingsPath='/client/settings'
          />
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side='left' className='w-[280px] sm:w-[320px] p-0'>
            <SheetHeader className='sr-only'>
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <PractitionerSidebarContent
              navLinks={navLinks}
              pathname={pathname}
              signOutCallbackUrl='/client/auth'
              settingsPath='/client/settings'
            />
          </SheetContent>
        </Sheet>
        <div className='flex flex-1 flex-col min-w-0'>
          {/* Removed logo at the top for mobile/tablet */}
          <main className='flex-1 min-w-0'>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default function ClientMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </SidebarProvider>
  );
}
