import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

const PractitionerAuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  if (session) {
    if (session.user.role === 'CLIENT') {
      return notFound();
    } else {
      return redirect('/practitioner');
    }
  }
  return <>{children}</>;
};

export default PractitionerAuthLayout;
