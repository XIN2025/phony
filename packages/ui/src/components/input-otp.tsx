'use client';

import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { MinusIcon } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot='input-otp'
      containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot='input-otp-group' className={cn('flex items-center gap-1 gap-2 sm:gap-2', className)} {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot='input-otp-slot'
      data-active={isActive}
      className={cn(
        'bg-background relative flex items-center justify-center rounded-md border-2 border-zinc-300 font-medium transition-all',
        'h-10 w-10 text-lg',
        'sm:h-14 sm:w-14 sm:text-2xl',
        'focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/20',
        isActive && 'z-10 border-zinc-900 ring-2 ring-zinc-900/50',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='animate-caret-blink bg-foreground h-4 w-px duration-1000' />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot='input-otp-separator' role='separator' {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
