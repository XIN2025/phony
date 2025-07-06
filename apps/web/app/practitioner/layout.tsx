'use client';

import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <InviteContextProvider>
      <div className='min-h-screen w-full'>{children}</div>
    </InviteContextProvider>
  );
}
