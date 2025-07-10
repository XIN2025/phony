'use client';

import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <InviteContextProvider>
      <div className='relative min-h-screen w-full'>
        {/* Gradient background */}
        <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-100 via-yellow-50 to-blue-50' />
        {/* Removed right half image overlay for large screens */}
        <div className='relative z-20 min-h-screen w-full'>
          {/* Logo at the top for mobile/tablet */}

          {children}
        </div>
      </div>
    </InviteContextProvider>
  );
}
