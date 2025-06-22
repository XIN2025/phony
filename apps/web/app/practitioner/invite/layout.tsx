import { ReactNode } from 'react';
import { InviteContextProvider } from '@/context/InviteContext';

export default function InviteLayout({ children }: { children: ReactNode }) {
  return <InviteContextProvider>{children}</InviteContextProvider>;
}
