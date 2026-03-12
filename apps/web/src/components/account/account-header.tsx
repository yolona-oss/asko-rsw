'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccount } from './account-provider';
import { menuByRole, primaryRole } from '@/lib/account';
import { MenuIcon } from './menu-icon';
import { SkeletonCircle } from './skeleton';

export function AccountHeader() {
  const { stage, user } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menu = user ? menuByRole[primaryRole(user)] : [];

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-brand-red">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Открыть меню"
            className="flex flex-col gap-[5px] p-1"
          >
            <span className="block w-6 h-[2px] bg-white" />
            <span className="block w-3 h-[2px] bg-white" />
            <span className="block w-6 h-[2px] bg-white" />
          </button>
          <Link href="/">
            <Image src="/images/logo.svg" alt="ASKO" width={65} height={20} className="brightness-0 invert" />
          </Link>
        </div>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 z-50 w-64 h-full bg-page-bg shadow-lg">
              <div className="px-4 pt-4 pb-6">
                <Link href="/" onClick={() => setMenuOpen(false)}>
                  <Image src="/images/logo.svg" alt="ASKO" width={80} height={24} />
                  <span className="text-[10px] leading-3 text-brand-red tracking-[-0.01em]">
                    Фирменный магазин
                  </span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 px-4">
                {menu.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-2 py-3 text-base tracking-[-0.01em] ${isActive
                          ? 'text-brand-red font-medium'
                          : 'text-text-main'
                        }`}
                    >
                      <MenuIcon icon={item.icon} active={isActive} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 mt-8">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-1 text-sm text-text-main"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Вернуться на сайт
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Desktop top bar (notification + avatar) */}
      <div className="hidden lg:flex items-center justify-end gap-4 absolute top-8 right-8 z-10">
        {stage === 'loaded' ? (
          <>
            {/* Notification bell */}
            <button type="button" className="relative" aria-label="Уведомления">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#C4C4C4]">
              {user?.avatar && (
                <Image src={user.avatar} alt="" width={36} height={36} className="object-cover" />
              )}
            </div>
          </>
        ) : (
          <>
            <SkeletonCircle className="w-6 h-6" />
            <SkeletonCircle className="w-9 h-9" />
          </>
        )}
      </div>
    </>
  );
}
