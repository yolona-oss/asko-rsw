'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

const DURATION = 200;

export function Modal({ open, onClose, className, children }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, DURATION);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (closing || !onClose) return;
    onClose();
  }, [closing, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className={cn(
          'absolute inset-0 bg-black/60',
          closing
            ? 'animate-[fade-out_200ms_ease-in_forwards]'
            : 'animate-[fade-in_200ms_ease-out]',
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative bg-surface shadow-lg mx-4 max-h-[90vh] overflow-y-auto',
          closing
            ? 'animate-[modal-out_200ms_ease-in_forwards]'
            : 'animate-[modal-in_200ms_ease-out]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
