'use client';

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="w-4 h-4 border border-[#e0e0e0] bg-[#f1f1f1] flex items-center justify-center flex-shrink-0 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg className="w-3 h-3 text-[#323232]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
