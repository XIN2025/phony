'use client';

import Link from 'next/link';
import { Bell, Home, Menu, Users, File as FileIcon, MessageSquare } from 'lucide-react';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/components/sheet';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Logo } from '@repo/ui/components/logo';

// Helper to get initials for Avatars
const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0]?.[0] ?? ''}${names[names.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function PractitionerMainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? 'Ana Johnson';

  const navLinks = (
    <>
      <Link
        href='/practitioner'
        className='flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary'
      >
        <Home className='h-4 w-4' />
        Home
      </Link>
      <Link
        href='/practitioner/clients'
        className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary'
      >
        <Users className='h-4 w-4' />
        Clients
      </Link>
      <Link
        href='#'
        className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary'
      >
        <MessageSquare className='h-4 w-4' />
        Messages
        <Badge className='ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>2</Badge>
      </Link>
      <Link
        href='/practitioner/intake-forms'
        className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary'
      >
        <FileIcon className='h-4 w-4' />
        Forms
      </Link>
    </>
  );

  return (
    <div className='grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'>
      <div className='hidden border-r bg-white md:block'>
        <div className='flex h-full max-h-screen flex-col gap-2'>
          <div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
            <Link href='/' className='flex items-center gap-2 font-semibold'>
              <Logo />
              <span className=''>Continuum</span>
            </Link>
          </div>
          <div className='flex-1'>
            <nav className='grid items-start px-2 text-sm font-medium lg:px-4'>{navLinks}</nav>
          </div>

          <div className='mt-auto border-t'>
            <div className='flex items-center gap-3 p-4'>
              <Avatar className='h-10 w-10 border'>
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col'>
                <span className='font-semibold'>{userName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='flex flex-col bg-muted/40'>
        <header className='flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='flex flex-col'>
              <nav className='grid gap-2 text-lg font-medium'>
                <Link href='#' className='flex items-center gap-2 text-lg font-semibold'>
                  <Logo />
                  <span className='sr-only'>Continuum</span>
                </Link>
                {navLinks}
              </nav>
            </SheetContent>
          </Sheet>
          <div className='w-full flex-1' />
          <Button variant='outline' size='icon' className='ml-auto h-8 w-8'>
            <Bell className='h-4 w-4' />
            <span className='sr-only'>Toggle notifications</span>
          </Button>
        </header>
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
