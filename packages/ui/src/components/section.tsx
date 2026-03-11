import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn('py-12 sm:py-16 lg:py-20', className)}
      {...props}
    >
      {children}
    </section>
  );
}
