import Link from 'next/link';
import type { SpecRow } from './types';

interface ProductSpecsProps {
  specs: SpecRow[];
}

export function ProductSpecs({ specs }: ProductSpecsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
        Характеристики:
      </h3>
      <div className="flex flex-col gap-2">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-center gap-1">
            <span className="text-sm leading-[18px] tracking-[-0.01em] text-text-muted flex-shrink-0">
              {spec.label}
            </span>
            <span className="flex-1 border-b border-dashed border-text-muted min-w-[20px]" />
            <span className="text-sm leading-[14px] tracking-[-0.01em] text-text-main flex-shrink-0">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="#all-specs"
        className="inline-flex items-center gap-2 text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main"
      >
        Все характеристики...
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
