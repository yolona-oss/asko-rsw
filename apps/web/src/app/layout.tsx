import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';
import { AppProviders } from '@/store/providers';
import { YandexMetrika } from '@/components/YandexMetrika';
import '@/styles/globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://askoservis.ru';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ASKO — Ремонт бытовой техники на дому с гарантией',
    template: '%s — ASKO Сервис',
  },
  description: 'Профессиональный ремонт бытовой техники ASKO с выездом на дом. Оригинальные запчасти, опытные мастера, гарантия на все виды работ.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  alternates: {
    canonical: '/',
  },
};

// Inline script bodies — hardcoded string literals, no user input interpolation.
// They run before hydration to set the theme class / html lang, preventing FOUC.
// Key 'theme' must match STORAGE_KEYS.theme in lib/storage.ts.
const THEME_INIT = `try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch{}`;
const LANGUAGE_INIT = `try{var l=localStorage.getItem('language');if(l)document.documentElement.lang=l}catch{}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Script id="language-init" strategy="beforeInteractive">
          {LANGUAGE_INIT}
        </Script>
        <NextTopLoader color="var(--color-brand-red)" height={3} showSpinner={false} />
        <AppProviders>{children}</AppProviders>
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}
