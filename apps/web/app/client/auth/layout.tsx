'use client';

import { AuthLayout } from '@repo/ui/components/auth-layout';

export default function ClientAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
