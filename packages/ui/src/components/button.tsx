import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 focus-visible:ring-gray-500',
  outline:
    'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
  ghost:
    'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
