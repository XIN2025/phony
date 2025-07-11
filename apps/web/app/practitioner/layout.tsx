'use client';

import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <InviteContextProvider>
      <div className='relative min-h-screen w-full'>
        <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />
        <div className='relative z-20 min-h-screen w-full'>{children}</div>
      </div>
    </InviteContextProvider>
  );
}
