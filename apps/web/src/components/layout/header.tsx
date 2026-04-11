'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@asko/ui';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border-light">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-text-main">
            ASKO
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-sub hover:text-text-main transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-main hover:text-text-main transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-text-on-brand bg-info rounded-lg hover:bg-info-deep transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            className="md:hidden p-2 text-text-sub hover:text-text-main"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border-light py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-text-sub hover:text-text-main px-2 py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-border-light my-2" />
              <Link
                href="/login"
                className="text-sm font-medium text-text-main hover:text-text-main px-2 py-1"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-on-brand bg-info rounded-lg hover:bg-info-deep"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
