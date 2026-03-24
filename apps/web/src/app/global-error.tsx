'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="ru">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F1F1F1',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <p
              style={{
                fontSize: '120px',
                lineHeight: 1,
                fontWeight: 700,
                color: '#D9D9D9',
                userSelect: 'none',
              }}
            >
              500
            </p>
            <h1 style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#323232' }}>
              Критическая ошибка
            </h1>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#515151' }}>
              Произошла критическая ошибка приложения. Попробуйте обновить страницу.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: '#EB001C',
                  borderRadius: '2px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Попробовать снова
              </button>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#323232',
                  border: '1px solid #D9D9D9',
                  borderRadius: '2px',
                  textDecoration: 'none',
                }}
              >
                На главную
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
