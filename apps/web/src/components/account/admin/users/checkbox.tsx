'use client';

import { Check } from 'lucide-react';

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="w-4 h-4 border border-[#e0e0e0] bg-[#f1f1f1] flex items-center justify-center flex-shrink-0 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      {checked && <Check className="w-3 h-3 text-[#323232]" strokeWidth={3} />}
    </button>
  );
}
