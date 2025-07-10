'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  isLoading?: boolean;
  showBackButton?: boolean;
  className?: string;
  children?: React.ReactNode;
  leftElement?: React.ReactNode;
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
  children,
  leftElement,
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
        'relative flex flex-col gap-0 border-b bg-transparent px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 min-h-[56px]',
        className,
      )}
    >
      <div className='flex flex-row items-center gap-2 pt-4 sm:pt-6 w-full'>
        {/* Children (toggle/menu button) on the left */}
        {children && <div className='flex-shrink-0 mr-2'>{children}</div>}
        {/* Heading (title/subtitle) */}
        <div className='flex flex-col gap-0 flex-1 min-w-0'>
          {isLoading ? (
            <>
              <Skeleton className={cn('h-8 w-48', titleClassName)} />
              {subtitle && <Skeleton className={cn('h-4 w-32 mt-2', subtitleClassName)} />}
            </>
          ) : (
            <>
              <h1 className={cn('text-xl font-bold tracking-tight sm:text-2xl truncate', titleClassName)}>{title}</h1>
              {subtitle && (
                <p className={cn('text-xs sm:text-sm text-muted-foreground mt-1 truncate', subtitleClassName)}>
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        {/* Back button and leftElement on the right (optional) */}
        <div className='flex items-center gap-2 ml-auto'>
          {showBackButton && (
            <button
              type='button'
              aria-label='Back'
              onClick={handleBack}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
          )}
          {leftElement && leftElement}
        </div>
      </div>
    </div>
  );
}
