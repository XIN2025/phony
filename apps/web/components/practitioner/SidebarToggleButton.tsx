'use client';

import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@repo/ui/components/button';

// Custom menu icon that matches the design
const MenuIcon = ({ className }: { className?: string }) => (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
    <path d='M3 7H21' stroke='#807171' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    <path d='M3 12H21' stroke='#807171' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    <path d='M3 17H21' stroke='#807171' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

export function SidebarToggleButton() {
  const { setSidebarOpen } = useSidebar();

  return (
    <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
      <MenuIcon className='h-6 w-6' />
      <span className='sr-only'>Toggle sidebar</span>
    </Button>
  );
}
