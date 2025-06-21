'use client';

import PractitionerMainLayout from './(main)/layout';
import { InviteContextProvider } from '@/context/InviteContext';

export default function PractitionerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <InviteContextProvider>
      <PractitionerMainLayout>{children}</PractitionerMainLayout>
    </InviteContextProvider>
  );
}
