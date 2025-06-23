'use client';
import { Home, Users, File as FileIcon, MessageSquare, Menu, X, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarContent } from '@/components/practitioner/Sidebar';
import { Sheet, SheetContent } from '@repo/ui/components/sheet';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
function PractitionerLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const navLinks = [
    { href: '/practitioner', icon: Home, label: 'Home' },
    { href: '/practitioner/clients', icon: Users, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/practitioner/forms', icon: FileIcon, label: 'Forms' },
  ];
  return (
    <div className='grid h-screen w-full lg:grid-cols-[280px_1fr]'>
      <div className='hidden bg-background lg:block'>
        <SidebarContent navLinks={navLinks} pathname={pathname} />
      </div>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-[280px] p-0'>
          <SidebarContent navLinks={navLinks} pathname={pathname} />
        </SheetContent>
      </Sheet>
      <div className='flex flex-1 flex-col overflow-auto'>{children}</div>
    </div>
  );
}
export default function PractitionerMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PractitionerLayoutContent>{children}</PractitionerLayoutContent>
    </SidebarProvider>
  );
}
