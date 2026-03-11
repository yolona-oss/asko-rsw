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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            ASKO
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-200 my-2" />
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
