'use client';

import Link from 'next/link';
import { Home, Users, MessageSquare, PanelLeft, Settings, LogOut, FileText } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/components/sheet';
import { Logo } from '@repo/ui/components/logo';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const navItems = [
  { href: '/practitioner', icon: Home, label: 'Home' },
  { href: '/practitioner/clients', icon: Users, label: 'Clients' },
  { href: '/practitioner/intake-forms', icon: FileText, label: 'Intake Forms' },
  { href: '/practitioner/messages', icon: MessageSquare, label: 'Messages' },
];

const SidebarNav = ({ isDesktop = false }) => (
  <nav className={`flex ${isDesktop ? 'flex-col items-center gap-4 px-2 sm:py-5' : 'flex-col gap-2'}`}>
    {navItems.map((item) =>
      isDesktop ? (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className='flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8'
              >
                <item.icon className='h-5 w-5' />
                <span className='sr-only'>{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side='right'>{item.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Link
          key={item.label}
          href={item.href}
          className='flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
        >
          <item.icon className='h-5 w-5' />
          {item.label}
        </Link>
      ),
    )}
  </nav>
);

const handleLogout = () => {
  signOut({ callbackUrl: '/practitioner/auth' });
};

export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/practitioner/auth');
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar for unauthenticated users
  if (status === 'unauthenticated') {
    return <>{children}</>;
  }

  // Only show sidebar for authenticated users
  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <aside className='fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex'>
        <div className='flex h-14 items-center justify-center border-b px-2'>
          <Link
            href='/practitioner'
            className='group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base'
          >
            <Logo className='h-4 w-4 transition-all group-hover:scale-110' />
            <span className='sr-only'>Continuum</span>
          </Link>
        </div>
        <SidebarNav isDesktop />
        <nav className='mt-auto flex flex-col items-center gap-4 px-2 sm:py-5'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href='/practitioner/settings'
                  className='flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8'
                >
                  <Settings className='h-5 w-5' />
                  <span className='sr-only'>Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side='right'>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleLogout}
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8'
                >
                  <LogOut className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>Logout</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-14'>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
          <Sheet>
            <SheetTrigger asChild>
              <Button size='icon' variant='outline' className='sm:hidden'>
                <PanelLeft className='h-5 w-5' />
                <span className='sr-only'>Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='sm:max-w-xs'>
              <div className='flex h-14 items-center border-b px-2'>
                <Link
                  href='/practitioner'
                  className='group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground'
                >
                  <Logo className='h-5 w-5' />
                  <span className=''>Continuum</span>
                </Link>
              </div>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          {/* We can add breadcrumbs here later */}
        </header>
        {children}
      </div>
    </div>
  );
}
