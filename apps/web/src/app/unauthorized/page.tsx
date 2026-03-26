import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Доступ запрещён - ASKO',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-page-bg px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] leading-none font-bold text-border-light select-none">401</p>
        <h1 className="mt-2 text-2xl font-bold text-text-main">Доступ запрещён</h1>
        <p className="mt-3 text-sm text-text-sub">
          Для доступа к этой странице необходимо авторизоваться.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/auth"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm hover:opacity-90 transition-opacity"
          >
            Войти
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-text-main border border-border-light rounded-sm hover:border-text-sub transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
