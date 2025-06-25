'use client';
import { Home, MessageSquare, Menu, History, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';

const ClientLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const navLinks = [
    { href: '/client', icon: Home, label: 'Home' },
    { href: '/client/journey', icon: History, label: 'My Journey' },
    { href: '/client/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/client/profile', icon: User, label: 'Profile & Settings' },
  ];

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
        <header className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden'>
          <div className='container flex h-14 items-center px-4'>
            <Button variant='ghost' size='icon' onClick={() => setSidebarOpen(true)}>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle sidebar</span>
            </Button>
            <div className='ml-4'>
              <h1 className='text-lg font-semibold'>Continuum</h1>
            </div>
          </div>
        </header>
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
