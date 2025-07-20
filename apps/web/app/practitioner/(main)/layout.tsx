'use client';
import { usePathname } from 'next/navigation';
import { SidebarContent, HomeIcon, ClientsIcon, MessagesIcon, JournalsIcon } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';
import { PractitionerBottomNavigation } from '@/components/practitioner/BottomNavigation';
import { PractitionerHeader } from '@/components/practitioner/PractitionerHeader';

function PractitionerLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const navLinks = [
    { href: '/practitioner', icon: HomeIcon, label: 'Dashboard' },
    { href: '/practitioner/clients', icon: ClientsIcon, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessagesIcon, label: 'Messages' },
    { href: '/practitioner/forms', icon: JournalsIcon, label: 'Intake Forms' },
  ];

  // Check if we're on the messages page
  const isMessagesPage = pathname === '/practitioner/messages';

  return (
    <div className={`relative min-h-screen w-full ${isMessagesPage ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
      {/* Gradient background - matching client style */}
      <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />

      <div className='relative z-10 grid min-h-screen w-full lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] 2xl:grid-cols-[360px_1fr]'>
        {/* Sidebar */}
        <div className='hidden lg:block h-full'>
          <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/' homePath='/practitioner' />
        </div>
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side='left' className='w-[260px] sm:w-[280px] lg:w-[320px] p-0 bg-transparent'>
            <SheetHeader className='sr-only'>
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/' homePath='/practitioner' />
          </SheetContent>
        </Sheet>
        {/* Main Content */}
        <div className='flex flex-1 flex-col min-w-0 h-screen'>
          {/* Fixed header for mobile only */}
          <div className='lg:hidden'>
            <PractitionerHeader />
          </div>
          <main className='flex-1 flex justify-center items-start bg-transparent min-w-0 pb-16 lg:pb-0 overflow-y-auto'>
            <div className='w-full min-w-0'>{children}</div>
          </main>
          {/* Bottom Navigation for Mobile */}
          <PractitionerBottomNavigation />
        </div>
      </div>
    </div>
  );
}

export default function PractitionerMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className='min-h-screen w-full font-sans'>
        <PractitionerLayoutContent>{children}</PractitionerLayoutContent>
      </div>
    </SidebarProvider>
  );
}
