import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

const PractitionerLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/practitioner/auth');
  }

  if (session?.user?.role !== 'PRACTITIONER') {
    return notFound();
  }
  return <>{children}</>;
};

export default PractitionerLayout;
