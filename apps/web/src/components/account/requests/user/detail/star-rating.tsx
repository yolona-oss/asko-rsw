'use client';

import { Star } from 'lucide-react';

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="cursor-pointer"
        >
          <Star
            className={`w-8 h-8 ${star <= value ? 'text-warning fill-warning' : 'text-border-light'}`}
          />
        </button>
      ))}
    </div>
  );
}
