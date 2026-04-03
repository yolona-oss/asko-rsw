import type { Metadata } from 'next';
import { Suspense } from 'react';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col">
        <AppProviders>{children}</AppProviders>
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}
