'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@/lib/utils';

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
        'relative flex flex-col gap-0 border-b bg-transparent px-3 sm:px-4 lg:px-6 xl:px-8 pb-2 sm:pb-3 lg:pb-4 min-h-[48px] sm:min-h-[56px]',
        className,
      )}
    >
      {/* Header row: leftElement (sidebar/back), title, rightElement (actions) all on the same line */}
      <div className='flex flex-row items-center pt-3 sm:pt-4 lg:pt-6 w-full min-w-0'>
        {/* Sidebar toggle or back button on the far left */}
        {leftElement && <div className='flex items-center flex-shrink-0 mr-2'>{leftElement}</div>}
        {showBackButton && !leftElement && (
          <button
            type='button'
            aria-label='Back'
            onClick={handleBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none mr-2'
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7' />
          </button>
        )}
        {/* Title in the center/left, flex-1 to push rightElement to the right */}
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
      {/* Subtitle always below the header row */}
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
