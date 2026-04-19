'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DropdownMenu, SkeletonCircle } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { useAccount } from './provider';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectLayout, setMobileMenuOpen } from '@/store/preferences-slice';
import { useFormGuardContext } from './form-guard-context';
import { useLogout } from '@/lib/api/use-auth';
import { useRouter } from 'next/navigation';
import { User, LogOut, Monitor } from 'lucide-react';
import { NotificationBell } from '../notifications';
import { SettingsDropdown } from './settings-dropdown';
import { SessionsDialog } from './sessions-dialog';

export function AccountHeader() {
  const { user } = useAccount();
  const headerDispatch = useAppDispatch();
  const { mobileMenuOpen: mobileOpen } = useAppSelector(selectLayout);
  const setMobileOpen = (open: boolean) => headerDispatch(setMobileMenuOpen(open));
  const { getGuard } = useFormGuardContext();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const router = useRouter();
  const logout = useLogout();

  const guardedPush = useCallback(
    (href: string) => {
      const guard = getGuard();
      if (guard?.dirty) {
        guard.confirmLeave().then((confirmed) => {
          if (confirmed) router.push(href);
        });
      } else {
        router.push(href);
      }
    },
    [getGuard, router],
  );

  const avatarDropdownItems: DropdownMenuEntry[] = [
    {
      key: 'profile',
      label: 'Профиль',
      icon: <User className="w-4 h-4" />,
      onClick: () => guardedPush('/account/profile'),
    },
    {
      key: 'devices',
      label: 'Устройства',
      icon: <Monitor className="w-4 h-4" />,
      onClick: () => setSessionsDialogOpen(true),
    },
    'separator',
    {
      key: 'logout',
      label: 'Выйти',
      variant: 'danger',
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => setLogoutDialogOpen(true),
    },
  ];

  const avatarElement = user ? (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-skeleton">
      {user?.avatar ? (
        <Image src={user.avatar} alt="" width={36} height={36} className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl text-text-on-dark font-medium">
          {user?.firstName?.[0]?.toUpperCase() || user?.lastName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  ) : (
    <SkeletonCircle className="w-9 h-9" />
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-page-bg border-b border-border-light lg:absolute lg:top-8 lg:right-8 lg:left-auto lg:border-0 lg:bg-transparent lg:z-10">
        <div className="flex items-center justify-between px-4 py-4 lg:px-0 lg:py-0 lg:gap-4">
          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="flex flex-col justify-center items-start w-[33px] h-[25px] relative cursor-pointer lg:hidden"
          >
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: '33px',
                top: mobileOpen ? '10px' : '0px',
                transform: mobileOpen ? 'rotate(45deg)' : 'rotate(0)',
              }}
            />
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out"
              style={{
                width: '16.5px',
                top: '10px',
                opacity: mobileOpen ? 0 : 1,
                transform: mobileOpen ? 'translateX(-8px)' : 'translateX(0)',
              }}
            />
            <span
              className="block h-[5px] bg-text-main absolute left-0 transition-all duration-300 ease-in-out origin-center"
              style={{
                width: '33px',
                top: mobileOpen ? '10px' : '20px',
                transform: mobileOpen ? 'rotate(-45deg)' : 'rotate(0)',
              }}
            />
          </button>

          {/* Right: settings + notification bell + avatar */}
          <div className="flex items-center gap-4">
            <SettingsDropdown />
            {user ? (
              <NotificationBell />
            ) : (
              <SkeletonCircle className="w-6 h-6" />
            )}
            <DropdownMenu
              trigger={
                <button type="button" className="cursor-pointer" aria-label="Меню пользователя">
                  {avatarElement}
                </button>
              }
              items={avatarDropdownItems}
              placement="bottom-end"
            />
          </div>
        </div>
      </header>

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

      <SessionsDialog
        open={sessionsDialogOpen}
        onClose={() => setSessionsDialogOpen(false)}
      />
    </>
  );
}
