'use client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { MessageSquare } from 'lucide-react';

const ClientMessagesPage = () => {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl'>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>Messages</h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Communicate with your practitioner</p>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <Card>
          <CardHeader className='pb-3 sm:pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
              <MessageSquare className='h-5 w-5' />
              Messages Center
            </CardTitle>
            <CardDescription className='text-sm sm:text-base'>
              Send and receive messages with your healthcare practitioner
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4 sm:p-6'>
            <div className='text-center py-8 sm:py-12'>
              <MessageSquare className='h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg sm:text-xl font-semibold mb-2'>Messages Coming Soon</h3>
              <p className='text-muted-foreground text-sm sm:text-base max-w-md mx-auto'>
                The messaging feature is currently under development. You'll be able to communicate directly with your
                practitioner here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientMessagesPage;
