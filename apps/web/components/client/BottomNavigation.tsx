'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navLinks = [
  { href: '/client', icon: Home, label: 'Home' },
  { href: '/client/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/client/journals', icon: FileText, label: 'Journals' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 bg-[#f8efef] lg:hidden'>
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
                isActive ? 'bg-[#807171] text-white gap-2' : 'text-gray-600 hover:text-gray-900 gap-0',
              )}
            >
              <IconComponent className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-600')} />
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-white opacity-100 w-auto' : 'text-gray-600 opacity-0 w-0',
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
