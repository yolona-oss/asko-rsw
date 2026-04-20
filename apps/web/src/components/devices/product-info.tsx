import Link from 'next/link';
import type { Product } from './types';
import { ProductSpecs } from './product-specs';

function ShieldIcon() {
  return (
    <svg className="w-8 h-8 flex-shrink-0 text-brand-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg className="w-8 h-8 flex-shrink-0 text-brand-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
    </svg>
  );
}

function UserStarIcon() {
  return (
    <svg className="w-8 h-8 flex-shrink-0 text-brand-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-[29px] h-[29px] text-warning" viewBox="0 0 29 29" fill="currentColor">
      <path d="M14.5 0l4.49 8.26L28.5 10.5l-7 6.83 1.65 9.67L14.5 22.5l-8.65 4.5 1.65-9.67-7-6.83 9.51-2.24L14.5 0z" />
    </svg>
  );
}

const badgeIcons = {
  shield: ShieldIcon,
  gem: GemIcon,
  user: UserStarIcon,
};

interface ProductInfoProps {
  product: Product;
  mobileLayout?: boolean;
}

export function ProductInfo({ product, mobileLayout }: ProductInfoProps) {
  const badges = (
    <div className="flex flex-wrap gap-2">
      {product.badges.map((badge) => {
        const Icon = badgeIcons[badge.icon];
        return (
          <div
            key={badge.label}
            className="flex items-center gap-1 px-2 py-2 border-2 border-border-light/54"
          >
            <Icon />
            <span className="text-sm leading-[18px] tracking-[-0.01em] text-brand-red">
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  const stars = (
    <div className="flex gap-2">
      {Array.from({ length: product.rating }).map((_, i) => (
        <StarIcon key={i} />
      ))}
    </div>
  );

  // Mobile: title + subtitle + stars + badges (no specs here, they're separate)
  if (mobileLayout) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] leading-9 font-normal tracking-[-0.01em] text-text-main">
              {product.title}
            </h1>
            <p className="text-sm leading-[18px] tracking-[-0.01em] text-brand-red">
              {product.subtitle}
            </p>
          </div>
          {stars}
        </div>
        {badges}
      </div>
    );
  }

  // Desktop: full info panel
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[32px] leading-9 font-medium tracking-[-0.01em] text-text-main">
                {product.title}
              </h1>
              <p className="text-sm leading-[18px] tracking-[-0.01em] text-brand-red">
                {product.subtitle}
              </p>
            </div>
            {stars}
          </div>
          {badges}
        </div>

        <ProductSpecs specs={product.specsPreview} />
      </div>

      <Link
        href="#cta"
        className="inline-flex items-center justify-center w-fit px-6 py-2.5 text-sm font-medium text-text-on-brand bg-brand-red-dark shadow-sm"
      >
        Вызвать мастера
      </Link>
    </div>
  );
}
