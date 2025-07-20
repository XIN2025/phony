'use client';
import React, { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat';

const ClientMessagesPage = () => {
  const [chatHeight, setChatHeight] = useState(() => {
    // Set initial height based on screen size
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return '80vh';
    }
    return 'calc(100vh - 128px)';
  });

  useEffect(() => {
    const updateHeight = () => {
      const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint

      if (isLargeScreen) {
        // On large screens, use a fixed height for better centering
        setChatHeight('80vh');
      } else {
        // Calculate available height: viewport height - header height - bottom navigation height
        const headerHeight = 64; // ClientHeader height (py-3 = 12px top + 12px bottom + content)
        const bottomNavHeight = 64; // BottomNavigation height (py-2 = 8px top + 8px bottom + content)
        const totalOffset = headerHeight + bottomNavHeight;

        setChatHeight(`calc(100vh - ${totalOffset}px)`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div className='flex flex-col w-full lg:pt-10 h-full lg:justify-center lg:items-center overflow-hidden'>
      {/* Chat container that takes calculated available space */}
      <div className='flex-1 min-h-0 w-full lg:w-full lg:max-h-[80vh] overflow-hidden'>
        <ChatContainer height={chatHeight} className='w-full h-full lg:h-auto lg:max-h-[80vh] overflow-hidden' />
      </div>
    </div>
  );
};

export default ClientMessagesPage;
