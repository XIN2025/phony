'use client';
import { Home, MessageSquare, Menu, History, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
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
    { href: '/client/journey', icon: History, label: 'My Journey' },
    { href: '/client/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/client/profile', icon: User, label: 'Profile & Settings' },
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
    <div className='grid min-h-screen w-full lg:grid-cols-[280px_1fr]'>
      <div className='hidden bg-background lg:block'>
        <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/client/auth' />
      </div>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-[280px] p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/client/auth' />
        </SheetContent>
      </Sheet>
      <div className='flex flex-1 flex-col'>
        <main className='flex-1'>{children}</main>
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
