'use client';

import { useState } from 'react';
import { Button } from './button';
import { useUiLocale } from '../locale';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Label before copy (default: "Копировать") */
  label?: string;
  /** Label after copy (default: "Скопировано!") */
  copiedLabel?: string;
  className?: string;
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
}: CopyButtonProps) {
  const locale = useUiLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy} className={className}>
      {copied ? (copiedLabel ?? locale.copied) : (label ?? locale.copy)}
    </Button>
  );
}
