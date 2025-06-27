'use client';
import { ChatContainer } from '@/components/chat';

const ClientMessagesPage = () => {
  return (
    <div className='flex flex-col h-screen w-full overflow-hidden'>
      <div className='p-4 sm:p-6 border-b border-border/60 bg-muted/5 flex-shrink-0'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>Messages</h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Communicate with your practitioner</p>
      </div>

      <div className='flex-1 min-h-0 overflow-hidden p-1'>
        <ChatContainer height='100%' className='w-full h-full' />
      </div>
    </div>
  );
};

export default ClientMessagesPage;
