import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-page-bg px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] leading-none font-bold text-border-light select-none">404</p>
        <h1 className="mt-2 text-2xl font-bold text-text-main">Страница не найдена</h1>
        <p className="mt-3 text-sm text-text-sub">
          Запрашиваемая страница не существует или была удалена.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-text-on-brand bg-brand-red rounded-sm hover:opacity-90 transition-opacity"
          >
            На главную
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-text-main border border-border-light rounded-sm hover:border-text-sub transition-colors"
          >
            Личный кабинет
          </Link>
        </div>
      </div>
    </div>
  );
}
