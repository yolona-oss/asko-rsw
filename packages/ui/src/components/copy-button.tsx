'use client';

import { useState } from 'react';
import { Button } from './button';

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
  label = 'Копировать',
  copiedLabel = 'Скопировано!',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy} className={className}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
