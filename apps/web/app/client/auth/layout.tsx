import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

const ClientAuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  if (session) {
    if (session.user.role === 'PRACTITIONER') {
      return notFound();
    } else {
      return redirect('/client');
    }
  }
  return <>{children}</>;
};

export default ClientAuthLayout;
