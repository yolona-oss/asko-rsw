'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@asko/ui';

const sidebarLinks = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/settings', label: 'Settings' },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ASKO
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
