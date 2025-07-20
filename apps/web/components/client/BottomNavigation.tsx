'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { HomeIcon, MessagesIcon, JournalsIcon } from '@/components/practitioner/Sidebar';

interface NavLink {
  href: string;
  icon: React.ComponentType<{ className?: string; isActive?: boolean }>;
  label: string;
}

interface BottomNavigationProps {
  navLinks: NavLink[];
  className?: string;
}

export function BottomNavigation({ navLinks, className }: BottomNavigationProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 z-50 bg-[#f8efef] lg:hidden', className)}>
      <div className='flex items-center justify-around px-4 py-2'>
        {navLinks.map((link, index) => {
          const isActive = pathname === link.href;
          const isHovered = hoveredIndex === index;
          const IconComponent = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                'flex items-center justify-center py-2 px-3 rounded-lg',
                isActive ? 'bg-[#807171] text-[#FDF9F5] gap-2' : 'text-gray-600 hover:text-gray-900 gap-0',
              )}
            >
              <IconComponent
                className={cn('h-5 w-5', isActive ? 'text-[#FDF9F5]' : 'text-gray-600')}
                isActive={isActive}
              />
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-[#FDF9F5] opacity-100 w-auto' : 'text-gray-600 opacity-0 w-0',
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Client-specific bottom navigation
export function ClientBottomNavigation() {
  const navLinks = [
    { href: '/client', icon: HomeIcon, label: 'Home' },
    { href: '/client/messages', icon: MessagesIcon, label: 'Messages' },
    { href: '/client/journals', icon: JournalsIcon, label: 'Journals' },
  ];

  return <BottomNavigation navLinks={navLinks} />;
}
