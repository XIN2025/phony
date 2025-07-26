'use client';

import { InviteContextProvider } from '@/context/InviteContext';
import { SidebarProvider } from '@/context/SidebarContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className='relative min-h-screen w-full font-sans'>
        {/* Gradient background - matching client style */}
        <div className='absolute inset-0 z-0 bg-gradient-to-r from-red-50 via-orange-30 to-blue-50' />
        <div className='relative z-10 flex flex-col min-h-screen w-full'>
          <main className='flex-1 flex flex-col justify-start items-stretch bg-transparent min-w-0'>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
