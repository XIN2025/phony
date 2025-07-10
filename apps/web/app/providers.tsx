'use client';
import { ReactQueryClientProvider } from '@/lib/tanstack-query';
import { ThemeProvider } from '@repo/ui/components/theme-provider';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { Toaster } from '@repo/ui/components/sonner';
import { SessionProvider } from 'next-auth/react';
import { SignUpProvider } from '@/context/signup-context';

const Providers = ({ children }: { children: React.ReactNode }) => {
  console.log('[Providers] Initializing with SessionProvider');

  return (
    <SessionProvider
      refetchInterval={0} // Disable automatic refetch
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <SignUpProvider>
        <ThemeProvider attribute='class' defaultTheme='light'>
          <ReactQueryClientProvider>
            <Toaster duration={2500} richColors closeButton position='top-right' />
            <TooltipProvider>{children}</TooltipProvider>
          </ReactQueryClientProvider>
        </ThemeProvider>
      </SignUpProvider>
    </SessionProvider>
  );
};

export default Providers;
