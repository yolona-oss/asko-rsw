import Link from 'next/link';

interface ProductCareProps {
  title: string;
  description: string;
}

export function ProductCare({ title, description }: ProductCareProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-medium tracking-[-0.01em] text-text-main">
          {title}
        </h2>
        <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub lg:max-w-[643px]">
          {description}
        </p>
      </div>
      <Link
        href="#"
        className="inline-flex items-center gap-2 text-sm font-bold text-text-main underline tracking-[-0.01em]"
      >
        Читать рекомендацию по уходу
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
