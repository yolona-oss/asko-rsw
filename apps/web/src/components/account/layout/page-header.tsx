import { cn } from '@asko/ui';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  size?: 'default' | 'large';
  className?: string;
  children: ReactNode;
}

const sizeStyles = {
  default: 'text-[32px] lg:text-[36px] font-medium leading-[36px] tracking-[-0.01em] text-text-main',
  large: 'text-[32px] lg:text-[42px] font-medium leading-tight tracking-[-0.01em] text-text-main',
} as const;

export function PageHeader({ size = 'default', className, children }: PageHeaderProps) {
  return (
    <h1 className={cn(sizeStyles[size], className)}>
      {children}
    </h1>
  );
}
