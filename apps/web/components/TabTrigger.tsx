import { TabsTrigger } from '@repo/ui/components/tabs';
import React from 'react';

export function TabTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
    >
      {children}
    </TabsTrigger>
  );
}
