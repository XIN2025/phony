'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PageHeaderProps {
  title: React.ReactNode;
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
        'relative flex flex-col gap-0 border-b bg-transparent px-3 sm:px-4 lg:px-6 xl:px-8 pb-2 sm:pb-3 lg:pb-4 min-h-[48px] sm:min-h-[56px] max-w-full',
        className,
      )}
    >
      <div className='flex flex-row items-center pt-3 sm:pt-4 lg:pt-6 w-full min-w-0'>
        {leftElement && <div className='flex items-center flex-shrink-0 mr-2'>{leftElement}</div>}
        {showBackButton && !leftElement && (
          <button
            type='button'
            aria-label='Back'
            onClick={handleBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none mr-2 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'
          >
            <ArrowLeft className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7' />
          </button>
        )}
        <div className='flex-1 min-w-0'>
          {isLoading ? (
            <Skeleton className={cn('h-6 sm:h-8 w-32 sm:w-48', titleClassName)} />
          ) : (
            <h1
              className={cn('text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate', titleClassName)}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {title}
            </h1>
          )}
        </div>
        {rightElement && <div className='flex items-center flex-shrink-0 ml-2'>{rightElement}</div>}
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
    if (onBack) onBack();
    else router.back();
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
          <span
            style={{
              color: '#807171',
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1,
              display: 'inline-block',
              fontFamily: 'inherit',
              verticalAlign: 'middle',
            }}
          >
            {'<'}
          </span>
        </button>
      )}
      <span
        className='font-bold'
        style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#18120F', lineHeight: 1 }}
      >
        <Link href='/' className='hover:underline focus:outline-none'>
          Continuum
        </Link>
      </span>
      {children && <div className='ml-4 flex-1'>{children}</div>}
    </div>
  );
}
