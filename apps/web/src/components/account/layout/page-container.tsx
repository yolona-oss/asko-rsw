import { cn } from '@asko/ui';
import type { ReactNode } from 'react';

export interface PageContainerProps {
  className?: string;
  children: ReactNode;
}

export function PageContainer({ className, children }: PageContainerProps) {
  return (
    <div className={cn('p-4 lg:p-8 flex flex-col gap-6 lg:gap-8', className)}>
      {children}
    </div>
  );
}
