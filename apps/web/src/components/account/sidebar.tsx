'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dialog } from '@asko/ui';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAccount } from './account-provider';
import { menuByRole, primaryRole } from '@/lib/account';
import { useLogout } from '@/lib/api/use-auth';
import { MenuIcon } from './menu-icon';
import { SkeletonBlock, SkeletonCircle } from '@/components/skeleton';

export function AccountSidebar() {
  const pathname = usePathname();
  const { stage, user } = useAccount();
  const menu = user ? menuByRole[primaryRole(user)] : [];
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const logout = useLogout();

  return (
    <aside className="hidden lg:flex flex-col w-[200px] flex-shrink-0 bg-page-bg border-r border-border-light sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-6 pt-6 pb-8">
        {stage === 'skeleton' ? (
          <SkeletonBlock className="w-[100px] h-[30px]" />
        ) : (
          <Link href="/">
            <Image src="/images/logo.svg" alt="ASKO" width={100} height={30} />
            <span className="text-[10px] leading-3 text-brand-red tracking-[-0.01em]">
              Фирменный магазин
            </span>
          </Link>
        )}
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1 px-4 flex-1">
        {stage === 'skeleton' ? (
          // Skeleton menu items
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <SkeletonCircle className="w-5 h-5" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          ))
        ) : (
          menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-2 py-2 text-sm tracking-[-0.01em] transition-colors ${isActive
                  ? 'text-brand-red font-medium'
                  : 'text-text-main hover:text-brand-red'
                  }`}
              >
                {stage === 'loaded' ? (
                  <MenuIcon icon={item.icon} active={isActive} />
                ) : (
                  <SkeletonCircle className="w-5 h-5" />
                )}
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      {/* Back to site + Logout */}
      <div className="px-4 pb-6 flex flex-col gap-3">
        {stage === 'loaded' ? (
          <>
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться на сайт
            </Link>
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </>
        ) : (
          <>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-16" />
          </>
        )}
      </div>

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
    </aside>
  );
}
