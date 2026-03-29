import Link from 'next/link';

export function ArticleBreadcrumb() {
    return (
        <div className="mb-8 md:mb-6">
            <nav className="text-sm leading-[18px] tracking-[-0.01em] text-[#323232] mb-6 lg:mb-0">
                <Link href="/" className="hover:text-brand-red transition-colors">
                    Главная
                </Link>
                <span className="mx-1">&mdash;</span>
                <Link href="/articles" className="hover:text-brand-red transition-colors">
                    Статьи
                </Link>
            </nav>

            <Link
                href="/articles"
                className="lg:hidden flex items-center gap-2 text-sm font-bold text-[#323232] underline tracking-[-0.01em] mt-6"
            >
                <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                Вернуться назад на сайт
            </Link>
        </div>
    );
}
