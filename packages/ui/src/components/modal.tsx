'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, className, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-sm shadow-lg mx-4 max-h-[90vh] overflow-y-auto',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
