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

  return (
    <div className='relative min-h-screen w-full'>
      {/* Gradient background - matching client style */}
      <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />
      {/* Subtle purplish cloudy gradient shape - harmonized with background */}
      <div
        className='pointer-events-none absolute z-0'
        style={{
          left: '40vw',
          top: '55vh',
          width: '48vw',
          height: '180px',
          background: 'radial-gradient(ellipse 60% 100% at 60% 40%, rgba(139,92,246,0.13) 0%, transparent 80%)',
          filter: 'blur(32px)',
          opacity: 0.38,
          borderRadius: '60% 80% 70% 50% / 70% 40% 80% 60%',
        }}
      />
      {/* Desktop grid layout */}
      <div className='relative z-10 hidden lg:grid min-h-screen w-full lg:grid-cols-[220px_1fr] xl:grid-cols-[260px_1fr] 2xl:grid-cols-[300px_1fr]'>
        {/* Sidebar */}
        <div className='hidden lg:block h-full'>
          <SidebarContent navLinks={navLinks} pathname={pathname} signOutCallbackUrl='/' homePath='/practitioner' />
        </div>
        {/* Main Content for desktop */}
        <div className='flex flex-1 flex-col min-w-0'>
          <main className='flex-1 flex justify-center items-start bg-transparent min-w-0 pb-16 lg:pb-0'>
            <div className='w-full min-w-0'>{children}</div>
          </main>
          {/* Bottom Navigation for Mobile (hidden on desktop) */}
          <div className='lg:hidden'>
            <PractitionerBottomNavigation />
          </div>
        </div>
      </div>
      {/* Main Content for mobile (not grid) */}
      <div className='lg:hidden relative z-10'>
        <PractitionerHeader />
        <main className='flex-1 flex flex-col justify-center items-start bg-transparent min-w-0 pb-16'>
          <div className='w-full min-w-0'>{children}</div>
        </main>
        <PractitionerBottomNavigation />
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
