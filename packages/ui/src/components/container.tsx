import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeStyles = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
} as const;

export function Container({ size = 'xl', className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeStyles[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
