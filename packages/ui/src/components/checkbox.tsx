'use client';

import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export function Checkbox({ checked, onChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-4 h-4 border border-[#e0e0e0] bg-[#f1f1f1] flex items-center justify-center flex-shrink-0 cursor-pointer',
        className,
      )}
      onClick={() => onChange(!checked)}
    >
      {checked && <Check className="w-3 h-3 text-[#323232]" strokeWidth={3} />}
    </button>
  );
}
