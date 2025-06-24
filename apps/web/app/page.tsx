import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'CLIENT') {
    redirect('/client');
  } else if (session?.user?.role === 'PRACTITIONER') {
    redirect('/practitioner');
  }

  return <LandingPage />;
};

export default Page;
