import { cn } from '../utils/cn';

const pulse = 'animate-pulse bg-[#C4C4C4]';

export interface SkeletonBlockProps {
  className?: string;
  red?: boolean;
}

export function SkeletonBlock({ className, red }: SkeletonBlockProps) {
  return (
    <div className={cn(red ? 'animate-pulse bg-[#F5A3A3]' : pulse, className)} />
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
