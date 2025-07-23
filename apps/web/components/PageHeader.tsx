'use client';
import React from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface PageHeaderProps {
  title?: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  isLoading?: boolean;
  showBackButton?: boolean;
  className?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
  largeBackButton?: boolean;
}

interface AuthHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  backUrl,
  isLoading = false,
  showBackButton = true,
  className,
  leftElement,
  rightElement,
  titleClassName,
  subtitleClassName,
  largeBackButton = false,
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      window.location.href = backUrl;
    } else {
      window.history.back();
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col gap-0 bg-transparent px-3 sm:px-4 lg:px-6 xl:px-8 pb-2 sm:pb-3 lg:pb-4 min-h-[48px] sm:min-h-[56px] max-w-full',
        className,
      )}
    >
      <div className='flex flex-col gap-0 w-full min-w-0'>
        <div className='flex flex-row items-center w-full'>
          {leftElement && <div className='flex items-center flex-shrink-0 mr-2'>{leftElement}</div>}
          {showBackButton && !leftElement && (
            <button
              type='button'
              aria-label='Back'
              onClick={handleBack}
              className={cn(
                'text-muted-foreground hover:text-foreground focus:outline-none mr-2 flex items-center justify-center',
                largeBackButton ? 'w-14 h-14' : 'w-9 h-9 sm:w-10 sm:h-10',
              )}
            >
              <Image
                src='/arrow-right.svg'
                alt='Back'
                width={largeBackButton ? 54 : 28}
                height={largeBackButton ? 54 : 28}
                className={largeBackButton ? 'h-14 w-14' : 'h-15 w-15'}
              />
            </button>
          )}
        </div>
        {title && (
          <div className='flex flex-row items-center justify-between w-full min-w-0 mt-2 sm:mt-0'>
            <div className='flex-1 min-w-0'>
              {isLoading ? (
                <Skeleton className={cn('h-6 sm:h-8 w-32 sm:w-48', titleClassName)} />
              ) : (
                <h1
                  className={cn('text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate', titleClassName)}
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {title}
                </h1>
              )}
            </div>
            {/* On small screens, rightElement is at the far right; on larger screens, keep as before */}
            {rightElement && <div className='flex items-center flex-shrink-0 ml-2'>{rightElement}</div>}
          </div>
        )}
      </div>
      {subtitle && (
        <div className='flex flex-col gap-0 flex-1 min-w-0 mt-1'>
          {isLoading ? (
            <Skeleton className={cn('h-3 sm:h-4 w-24 sm:w-32', subtitleClassName)} />
          ) : (
            <p className={cn('text-xs sm:text-sm text-muted-foreground truncate', subtitleClassName)}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AuthHeader({ showBackButton = true, onBack, className = '', children }: AuthHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Use router.back() to go to the previous page in history
      router.back();
    }
  };
  return (
    <div className={`flex items-center w-full ${className}`.trim()} style={{ minHeight: 40, padding: 0 }}>
      {showBackButton && (
        <button
          type='button'
          onClick={handleBack}
          aria-label='Back'
          className='flex items-center justify-center mr-2 focus:outline-none'
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', height: 28, width: 28 }}
        >
          <ChevronLeft className='h-7 w-7' style={{ color: '#807171' }} />
        </button>
      )}
      <Link href='/' className='hover:opacity-80 focus:outline-none transition-opacity'>
        <Image src='/Continuum.svg' alt='Continuum' width={120} height={32} className='h-8 w-auto' priority />
      </Link>
      {children && <div className='ml-4 flex-1'>{children}</div>}
    </div>
  );
}
