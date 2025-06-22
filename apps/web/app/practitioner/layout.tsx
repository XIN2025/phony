'use client';

import { SessionProvider } from 'next-auth/react';
import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InviteContextProvider>
        <div className='h-screen w-screen'>{children}</div>
      </InviteContextProvider>
    </SessionProvider>
  );
}
