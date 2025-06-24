'use client';
import { ReactQueryClientProvider } from '@/lib/tanstack-query';
import { ThemeProvider } from '@repo/ui/components/theme-provider';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { Toaster } from '@repo/ui/components/sonner';
import { SessionProvider } from 'next-auth/react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <ThemeProvider attribute='class' defaultTheme='light'>
        <ReactQueryClientProvider>
          <Toaster duration={2500} richColors closeButton position='top-right' />
          <TooltipProvider>{children}</TooltipProvider>
        </ReactQueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
