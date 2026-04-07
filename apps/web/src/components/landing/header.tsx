'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Container } from '@asko/ui';
import { useAuth } from '@/lib/api/use-auth';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/#services', label: 'Услуги' },
  { href: '/#about', label: 'О нас' },
  { href: '/devices', label: 'Модели' },
  { href: '/articles', label: 'Статьи' },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const { isAuthenticated, authReady } = useAuth();
  const pathname = usePathname();
  const accountHref = isAuthenticated ? '/account' : '/auth';
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(400);

  // Track menu scroll height for animation
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuHeight(menuRef.current.scrollHeight);
    }
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' && !activeHash;
    if (href.startsWith('/#')) return pathname === '/' && activeHash === href.slice(1);
    return pathname.startsWith(href);
  };

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-page-bg border-b border-border-light">
      <Container>
        <div className="flex items-center justify-between h-10 my-2 md:my-2">
          {/* Mobile: animated hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-start w-8 h-8 gap-0 p-0 relative cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: menuOpen ? '32px' : '32px',
                top: menuOpen ? '12px' : '4px',
                transform: menuOpen ? 'rotate(45deg)' : 'rotate(0)',
              }}
            />
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out"
              style={{
                width: '16px',
                top: '12px',
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? 'translateX(-8px)' : 'translateX(0)',
              }}
            />
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: menuOpen ? '32px' : '32px',
                top: menuOpen ? '12px' : '20px',
                transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0)',
              }}
            />
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
                onClick={() => link.href.startsWith('/#') && setActiveHash(link.href.slice(1))}
                className={`text-lg font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-brand-red/45 underline'
                    : 'text-text-main hover:text-brand-red'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            {!authReady ? (
              <div className="animate-pulse bg-skeleton h-9 w-[160px]" />
            ) : (
              <Link
                href={accountHref}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-text-main bg-surface/10 border border-border-light shadow-sm opacity-50 hover:opacity-100 transition-opacity"
              >
                Личный кабинет
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu — slide down with fade */}
        <div
          ref={menuRef}
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: menuOpen ? `${menuHeight}px` : '0px',
            opacity: menuOpen ? 1 : 0,
          }}
        >
          <div className="border-t border-border-light py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-medium px-2 py-1 ${
                    isActive(link.href) ? 'text-brand-red/45 underline' : 'text-text-main'
                  }`}
                  onClick={() => {
                    if (link.href.startsWith('/#')) setActiveHash(link.href.slice(1));
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-border-light my-2" />
              {!authReady ? (
                <div className="animate-pulse bg-skeleton h-9 w-full" />
              ) : (
                <Link
                  href={accountHref}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-main border border-border-light"
                  onClick={() => setMenuOpen(false)}
                >
                  Личный кабинет
                </Link>
              )}
            </nav>
          </div>
        </div>
      </Container>
    </header>
  );
}
