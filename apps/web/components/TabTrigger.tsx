import { TabsTrigger } from '@repo/ui/components/tabs';
import React from 'react';

export function TabTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsTrigger value={value} className={className}>
      {children}
    </TabsTrigger>
  );
}
