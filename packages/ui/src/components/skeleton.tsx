import { cn } from '../utils/cn';

const pulse = 'animate-pulse bg-skeleton';

export interface SkeletonBlockProps {
  className?: string;
  red?: boolean;
}

export function SkeletonBlock({ className, red }: SkeletonBlockProps) {
  return (
    <div className={cn(red ? 'animate-pulse bg-primary-200' : pulse, className)} />
  );
}

export interface SkeletonCircleProps {
  className?: string;
}

export function SkeletonCircle({ className }: SkeletonCircleProps) {
  return <div className={cn(pulse, 'rounded-full', className)} />;
}

export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return <div className={cn(pulse, className)} />;
}
