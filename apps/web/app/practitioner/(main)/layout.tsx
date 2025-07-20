'use client';
import { usePathname } from 'next/navigation';
import { SidebarContent, HomeIcon, ClientsIcon, MessagesIcon, JournalsIcon } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';

function PractitionerLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const navLinks = [
    { href: '/practitioner', icon: HomeIcon, label: 'Dashboard' },
    { href: '/practitioner/clients', icon: ClientsIcon, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessagesIcon, label: 'Messages' },
    { href: '/practitioner/forms', icon: JournalsIcon, label: 'Intake Forms' },
  ];

  return (
    <div className='grid min-h-screen w-full lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] 2xl:grid-cols-[360px_1fr]'>
      {/* Sidebar */}
      <div className='hidden lg:block h-full'>
        <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/' />
      </div>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-[260px] sm:w-[280px] lg:w-[320px] p-0 bg-transparent'>
          <SheetHeader className='sr-only'>
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/' />
        </SheetContent>
      </Sheet>
      {/* Main Content */}
      <div className='flex flex-1 flex-col min-w-0'>
        <main className='flex-1 flex justify-center items-start bg-transparent min-w-0'>
          <div className='w-full min-w-0'>{children}</div>
        </main>
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
