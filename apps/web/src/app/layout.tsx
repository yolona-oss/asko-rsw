import type { Metadata } from 'next';
import { AppProviders } from '@/store/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ASKO — Ремонт бытовой техники на дому с гарантией',
  description: 'Профессиональный ремонт бытовой техники ASKO с выездом на дом. Оригинальные запчасти, опытные мастера, гарантия на все виды работ.',
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
      </body>
    </html>
  );
}
