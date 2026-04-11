'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center bg-page-bg px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] leading-none font-bold text-border-light select-none">500</p>
        <h1 className="mt-2 text-2xl font-bold text-text-main">Ошибка сервера</h1>
        <p className="mt-3 text-sm text-text-sub">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться позже.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-text-on-brand bg-brand-red rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-text-main border border-border-light rounded-sm hover:border-text-sub transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}
