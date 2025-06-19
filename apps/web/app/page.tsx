import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

const Page = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'CLIENT') {
    redirect('/client');
  } else if (session?.user?.role === 'PRACTITIONER') {
    redirect('/practitioner');
  }
  return notFound();
};

export default Page;
