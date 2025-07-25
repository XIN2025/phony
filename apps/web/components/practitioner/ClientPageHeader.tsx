import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { MessageCircle } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';

interface ClientPageHeaderProps {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    createdAt?: string;
  };
  title?: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  onBack?: () => void;
  showMessagesButton?: boolean;
  showAvatar?: boolean;
}

export const ClientPageHeader: React.FC<ClientPageHeaderProps> = ({
  client,
  title,
  subtitle,
  rightActions,
  onBack,
  showMessagesButton = true,
  showAvatar = true,
}) => {
  const router = useRouter();
  return (
    <div className='0  backdrop-blur-sm  flex flex-col gap-0 px-2 lg:px-10 pt-2 pb-3 sm:pb-4'>
      <div className='w-full flex items-center'>
        <button
          type='button'
          aria-label='Back'
          onClick={onBack || (() => router.back())}
          className='text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full transition-all min-w-0 min-h-0 max-w-full max-h-full p-0'
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Image
            src='/arrow-right.svg'
            alt='Back'
            width={30}
            height={30}
            className='h-15 w-15 sm:h-7 sm:w-7 md:h-10 md:w-10'
          />
        </button>
      </div>
      <div className='flex flex-col gap-2 px-2 sm:px-0 mt-2 max-w-full'>
        <div className='flex flex-row items-center justify-between w-full gap-2'>
          <div className='flex flex-row items-center gap-3 min-w-0'>
            {showAvatar && (
              <Avatar className='h-12 w-12'>
                <AvatarImage
                  src={getAvatarUrl(client.avatarUrl, client)}
                  alt={`${client.firstName} ${client.lastName}`.trim()}
                />
                <AvatarFallback>
                  {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                </AvatarFallback>
              </Avatar>
            )}
            <div className='flex flex-col min-w-0'>
              <h1
                className='font-semibold mb-2 sm:mb-0 truncate text-xl sm:text-2xl lg:text-[26px] xl:text-[32px]'
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {title || `${client.firstName} ${client.lastName}`}
              </h1>
              {subtitle ? (
                <p className='text-xs sm:text-sm text-muted-foreground'>{subtitle}</p>
              ) : client.createdAt ? (
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  Client since {new Date(client.createdAt).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
          <div className='flex flex-col sm:flex-row flex-nowrap gap-2 sm:gap-3 min-w-0 sm:w-auto'>
            {/* Hide messages button on small screens */}
            <div className='hidden sm:block'>
              {showMessagesButton && client.id && (
                <Link href={`/practitioner/clients/${client.id}/messages`} className='ml-0 sm:ml-0 min-w-0'>
                  <Button
                    variant='outline'
                    className='rounded-full p-2 border border-black bg-transparent sm:w-auto min-w-0 shadow-none'
                  >
                    <MessageCircle className='h-4 w-4' />
                  </Button>
                </Link>
              )}
            </div>
            {rightActions && React.isValidElement(rightActions)
              ? React.cloneElement(rightActions as React.ReactElement<any>, {
                  className: [
                    (rightActions as React.ReactElement<any>).props.className,
                    'bg-[#807171] text-white rounded-full px-2 py-1 w-full min-w-0 max-w-full sm:px-6 sm:py-2 sm:w-auto sm:max-w-xs shadow-md hover:bg-neutral-800 transition-all flex-1',
                  ]
                    .filter(Boolean)
                    .join(' '),
                })
              : rightActions}
          </div>
        </div>
      </div>
    </div>
  );
};
