'use client';

import { Button } from './button';
import { Input } from './input';

export interface KVPair {
  key: string;
  value: string;
}

export interface KeyValueEditorProps {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  className?: string;
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Ключ',
  valuePlaceholder = 'Значение',
  addLabel = '+ Добавить',
  className,
}: KeyValueEditorProps) {
  const updatePair = (index: number, field: 'key' | 'value', val: string) => {
    const next = pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    onChange(next);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const addPair = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  return (
    <div className={className ?? 'flex flex-col gap-2 max-w-[500px]'}>
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(e) => updatePair(i, 'key', e.target.value)}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder={valuePlaceholder}
            value={pair.value}
            onChange={(e) => updatePair(i, 'value', e.target.value)}
            className="flex-1"
          />
          <Button variant="danger" size="sm" onClick={() => removePair(i)}>
            &times;
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addPair} className="self-start">
        {addLabel}
      </Button>
    </div>
  );
}

export function kvToRecord(pairs: KVPair[]): Record<string, string> | undefined {
  const filtered = pairs.filter((p) => p.key.trim());
  if (filtered.length === 0) return undefined;
  const obj: Record<string, string> = {};
  for (const p of filtered) {
    obj[p.key.trim()] = p.value;
  }
  return obj;
}

export function recordToKV(obj?: Record<string, any> | null): KVPair[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }));
}
