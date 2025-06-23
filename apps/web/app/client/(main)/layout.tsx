import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

const ClientLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/client/auth');
  }

  if (session?.user?.role !== 'CLIENT') {
    return notFound();
  }
  return <>{children}</>;
};

export default ClientLayout;
