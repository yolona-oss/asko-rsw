import type { SpecRow } from './types';

interface ProductAllSpecsProps {
  specsLeft: SpecRow[];
  specsRight: SpecRow[];
}

function SpecRowDesktop({ spec }: { spec: SpecRow }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm leading-[18px] tracking-[-0.01em] text-text-muted flex-shrink-0">
        {spec.label}
      </span>
      <span className="flex-1 border-b border-dashed border-text-muted min-w-[20px]" />
      <span className="text-sm leading-[14px] tracking-[-0.01em] text-text-main flex-shrink-0">
        {spec.value}
      </span>
    </div>
  );
}

function SpecRowMobile({ spec }: { spec: SpecRow }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm leading-[18px] tracking-[-0.01em] text-text-muted">
        {spec.label}
      </span>
      <span className="text-sm leading-[14px] tracking-[-0.01em] text-text-main">
        {spec.value}
      </span>
    </div>
  );
}

export function ProductAllSpecs({ specsLeft, specsRight }: ProductAllSpecsProps) {
  return (
    <div id="all-specs" className="flex flex-col gap-6">
      <h3 className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
        Все характеристики:
      </h3>

      {/* Desktop: two columns with dashed separators */}
      <div className="hidden lg:flex gap-[74px]">
        <div className="flex flex-col gap-2 flex-1 max-w-[426px]">
          {specsLeft.map((spec) => (
            <SpecRowDesktop key={spec.label} spec={spec} />
          ))}
        </div>
        <div className="flex flex-col gap-2 flex-1 max-w-[449px]">
          {specsRight.map((spec) => (
            <SpecRowDesktop key={spec.label} spec={spec} />
          ))}
        </div>
      </div>

      {/* Mobile: two bordered cards side by side, stacked label/value */}
      <div className="lg:hidden flex gap-6 overflow-x-auto">
        <div className="border-2 border-border-light/54 p-6 flex-shrink-0 w-[264px]">
          <div className="flex flex-col gap-2">
            {specsLeft.map((spec) => (
              <SpecRowMobile key={spec.label} spec={spec} />
            ))}
          </div>
        </div>
        <div className="border-2 border-border-light/54 p-6 flex-shrink-0 w-[264px]">
          <div className="flex flex-col gap-2">
            {specsRight.map((spec) => (
              <SpecRowMobile key={spec.label} spec={spec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
