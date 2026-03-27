'use client';

import { useState } from 'react';
import { Button } from '@asko/ui';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? 'Скопировано!' : 'Копировать'}
    </Button>
  );
}
