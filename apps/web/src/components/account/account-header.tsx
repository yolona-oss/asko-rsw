'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dialog } from '@asko/ui';
import { useAccount } from './account-provider';
import { menuByRole, primaryRole } from '@/lib/account';
import { useLogout } from '@/lib/api/use-auth';
import { MenuIcon } from './menu-icon';
import { SkeletonCircle } from '@/components/skeleton';
import { NotificationBell } from './notification-bell';

export function AccountHeader() {
  const { stage, user } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const pathname = usePathname();
  const menu = user ? menuByRole[primaryRole(user)] : [];
  const logout = useLogout();

  const avatarElement = stage === 'loaded' ? (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#C4C4C4]">
      {user?.avatar ? (
        <Image src={user.avatar} alt="" width={36} height={36} className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl text-white font-medium">
          {user?.firstName?.[0]?.toUpperCase() || user?.lastName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  ) : (
    <SkeletonCircle className="w-9 h-9" />
  );

  return (
    <>
      {/* Header — sticky on mobile, absolute on desktop */}
      <header className="sticky top-0 z-50 bg-page-bg border-b border-border-light lg:absolute lg:top-8 lg:right-8 lg:left-auto lg:border-0 lg:bg-transparent lg:z-10">
        <div className="flex items-center justify-between px-4 py-4 lg:px-0 lg:py-0 lg:gap-4">
          {/* Left: hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="flex flex-col justify-center items-start w-[33px] h-[25px] relative cursor-pointer lg:hidden"
          >
            <span
              className="block h-[5px] bg-[#323232] absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: '33px',
                top: menuOpen ? '10px' : '0px',
                transform: menuOpen ? 'rotate(45deg)' : 'rotate(0)',
              }}
            />
            <span
              className="block h-[5px] bg-[#323232] absolute left-0 transition-all duration-300 ease-in-out"
              style={{
                width: '16.5px',
                top: '10px',
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? 'translateX(-8px)' : 'translateX(0)',
              }}
            />
            <span
              className="block h-[5px] bg-[#323232] absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: '33px',
                top: menuOpen ? '10px' : '20px',
                transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0)',
              }}
            />
          </button>

          {/* Right: notification bell + avatar + logout */}
          <div className="flex items-center gap-4">
            {stage === 'loaded' ? (
              <NotificationBell />
            ) : (
              <SkeletonCircle className="w-6 h-6" />
            )}
            {avatarElement}
            {/* Logout — desktop only */}
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              aria-label="Выйти"
              className="hidden lg:block text-text-main hover:text-brand-red transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-[fade-in_200ms_ease-out] lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 w-64 h-full bg-page-bg shadow-lg animate-[slide-in-left_300ms_ease-out] lg:hidden">
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
            <div className="px-4 mt-8 flex flex-col gap-3">
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
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setLogoutDialogOpen(true); }}
                className="flex items-center gap-1 text-sm text-text-main"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Выйти
              </button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={logoutDialogOpen}
        title="Выйти из аккаунта?"
        description="Вы будете перенаправлены на страницу входа."
        confirmLabel="Выйти"
        cancelLabel="Отмена"
        loading={logout.isPending}
        onConfirm={() => logout.mutate()}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </>
  );
}
