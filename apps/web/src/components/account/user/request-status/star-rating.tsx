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
            className={`w-8 h-8 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-[#E8E8E8]'}`}
          />
        </button>
      ))}
    </div>
  );
}
