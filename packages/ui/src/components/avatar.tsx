import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback = '?',
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-full overflow-hidden bg-skeleton',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-medium">
          {fallback.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
