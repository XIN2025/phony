'use client';
import { Home, Users, File as FileIcon, MessageSquare, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';

function PractitionerLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const navLinks = [
    { href: '/practitioner', icon: Home, label: 'Dashboard' },
    { href: '/practitioner/clients', icon: Users, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/practitioner/forms', icon: FileIcon, label: 'Intake Forms' },
  ];

  return (
    <div className='grid min-h-screen w-full lg:grid-cols-[260px_1fr]'>
      {/* Sidebar */}
      <div className='hidden lg:block h-full'>
        <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/practitioner/auth' />
      </div>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-[260px] p-0 bg-transparent'>
          <SheetHeader className='sr-only'>
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/practitioner/auth' />
        </SheetContent>
      </Sheet>
      {/* Main Content */}
      <div className='flex flex-1 flex-col'>
        <main className='flex-1 flex justify-center items-start bg-transparent'>
          <div className='w-full max-w-[1450px]'>{children}</div>
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
