import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface ContainerProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const containerSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

const containerPadding = {
  none: '',
  sm: 'px-2 sm:px-4',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
};

function Container({ className, size = 'full', padding = 'md', children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full', containerSizes[size], containerPadding[padding], className)} {...props}>
      {children}
    </div>
  );
}

export { Container };
