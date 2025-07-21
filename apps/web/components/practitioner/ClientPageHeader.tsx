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
    <div className='flex flex-col gap-0 border-b px-2 lg:px-10 pt-2 pb-3 sm:pb-4'>
      <div className='w-full flex items-center'>
        <button
          type='button'
          aria-label='Back'
          onClick={onBack || (() => router.back())}
          className='text-muted-foreground hover:text-foreground focus:outline-none'
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Image src='/arrow-right.svg' alt='Back' width={54} height={54} className='h-14 w-14' />
        </button>
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-0 mt-2 max-w-full'>
        <div className='flex flex-row items-center gap-3 w-full sm:w-auto min-w-0'>
          {showAvatar && (
            <Avatar className='h-12 w-12'>
              <AvatarImage
                src={getAvatarUrl(client.avatarUrl, client)}
                alt={`${client.firstName} ${client.lastName}`.trim()}
              />
              <AvatarFallback>{getInitials({ firstName: client.firstName, lastName: client.lastName })}</AvatarFallback>
            </Avatar>
          )}
          <div className='flex flex-col'>
            <h1
              className='text-lg sm:text-xl md:text-3xl font-bold leading-tight'
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
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0'>
          {showMessagesButton && client.id && (
            <Link href={`/practitioner/clients/${client.id}/messages`} className='ml-0 sm:ml-0'>
              <Button variant='outline' className='rounded-full p-2 border border-border w-full sm:w-auto min-w-0'>
                <MessageCircle className='h-4 w-4' />
              </Button>
            </Link>
          )}
          {rightActions}
        </div>
      </div>
    </div>
  );
};
