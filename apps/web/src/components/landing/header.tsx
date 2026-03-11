'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@asko/ui';

const navLinks = [
  { href: '/', label: 'Главная', active: true },
  { href: '/#services', label: 'Услуги' },
  { href: '/#about', label: 'О нас' },
  { href: '/#models', label: 'Модели' },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-page-bg border-b border-border-light">
      <Container>
        <div className="flex items-center justify-between h-10 my-2 md:my-2">
          {/* Mobile: hamburger left, logo right */}
          <button
            type="button"
            className="md:hidden flex flex-col gap-1 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Открыть меню"
          >
            <span className="block w-8 h-[5px] bg-text-main" />
            <span className="block w-4 h-[5px] bg-text-main" />
            <span className="block w-8 h-[5px] bg-text-main" />
          </button>

          {/* Desktop: logo left */}
          <Link href="/" className="flex-shrink-0 md:order-first">
            <Image src="/images/logo.svg" alt="ASKO" width={65} height={20} className="md:w-[65px] w-[77px]" />
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium transition-colors ${
                  link.active
                    ? 'text-brand-red/45 underline'
                    : 'text-text-main hover:text-brand-red'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-text-main bg-white/10 border border-border-light shadow-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              Личный кабинет
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border-light py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-medium px-2 py-1 ${
                    link.active ? 'text-brand-red/45 underline' : 'text-text-main'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-border-light my-2" />
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-main border border-border-light"
                onClick={() => setMenuOpen(false)}
              >
                Личный кабинет
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
