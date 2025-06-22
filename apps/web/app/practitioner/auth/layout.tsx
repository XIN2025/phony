import { Button } from '@repo/ui/components/button';
import { AuthLayout } from '@repo/ui/components/auth-layout';
import Link from 'next/link';
import * as React from 'react';

export default function PractitionerAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout
      title='Unlock Your Potential'
      description='Join a community of professionals dedicated to making a difference through evidence-based practices.'
      loginHref='/practitioner/auth'
      ctaButton={
        <Button asChild>
          <Link href='/practitioner/auth/signup'>Get Started</Link>
        </Button>
      }
    >
      {children}
    </AuthLayout>
  );
}
