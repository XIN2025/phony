'use client';

import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <InviteContextProvider>
      <div className='relative min-h-screen w-full'>
        <div className='absolute inset-0 z-0 cloudy-gradient-background' />
        <div className='relative z-20 min-h-screen w-full'>{children}</div>
      </div>
    </InviteContextProvider>
  );
}
