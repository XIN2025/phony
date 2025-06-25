'use client';
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@repo/ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { LogOut } from 'lucide-react';
import { getInitials, getFullAvatarUrl } from '@/lib/utils';

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/client/auth',
      redirect: true,
    });
  };

  const userName =
    session?.user?.firstName && session?.user?.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : session?.user?.email?.split('@')[0] || 'User';

  const avatarUrl = getFullAvatarUrl(session?.user?.avatarUrl);

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container flex h-14 items-center justify-between px-4'>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold'>Continuum</h1>
          </div>

          {session?.user && (
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={avatarUrl} alt={`${userName}'s avatar`} />
                  <AvatarFallback className='text-sm'>{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <span className='text-sm font-medium hidden sm:inline-block'>{userName}</span>
              </div>
              <Button variant='ghost' size='sm' onClick={handleLogout} className='gap-2'>
                <LogOut className='h-4 w-4' />
                <span className='hidden sm:inline'>Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>{children}</main>
    </div>
  );
};

export default ClientLayout;
