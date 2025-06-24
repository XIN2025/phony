'use client';

import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';
import { Menu } from 'lucide-react';

export function SidebarToggleButton() {
  const { setSidebarOpen } = useSidebar();

  return (
    <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
      <Menu className='h-6 w-6' />
      <span className='sr-only'>Toggle sidebar</span>
    </Button>
  );
}
