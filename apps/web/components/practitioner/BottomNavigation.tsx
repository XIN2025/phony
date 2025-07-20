'use client';

import { BottomNavigation } from '@/components/client/BottomNavigation';
import { HomeIcon, ClientsIcon, MessagesIcon, JournalsIcon } from '@/components/practitioner/Sidebar';

// Practitioner-specific bottom navigation
export function PractitionerBottomNavigation() {
  const navLinks = [
    { href: '/practitioner', icon: HomeIcon, label: 'Dashboard' },
    { href: '/practitioner/clients', icon: ClientsIcon, label: 'Clients' },
    { href: '/practitioner/messages', icon: MessagesIcon, label: 'Messages' },
    { href: '/practitioner/forms', icon: JournalsIcon, label: 'Forms' },
  ];

  return <BottomNavigation navLinks={navLinks} />;
}
