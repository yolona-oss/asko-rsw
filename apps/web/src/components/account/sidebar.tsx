'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dialog } from '@asko/ui';
import { ArrowLeft, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAccount } from './account-provider';
import { useSidebar } from './sidebar-context';
import { menuByRole, primaryRole } from '@/lib/account';
import { useLogout } from '@/lib/api/use-auth';
import { MenuIcon } from './menu-icon';
import { SkeletonBlock, SkeletonCircle } from '@/components/skeleton';

const SIDEBAR_WIDTH = 256;
const EDGE_THRESHOLD = 24;
const VELOCITY_THRESHOLD = 0.4;
const POSITION_THRESHOLD = 0.35;

// ─── Desktop Sidebar ─────────────────────────────────────────────────────────

export function AccountSidebar() {
  const pathname = usePathname();
  const { stage, user } = useAccount();
  const { collapsed, toggleCollapsed } = useSidebar();
  const menu = user ? menuByRole[primaryRole(user)] : [];
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const logout = useLogout();

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 bg-[#fff] border-r border-border-light sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 60 : 200 }}
    >
      {/* Logo */}
      <div className={`pt-6 pb-8 ${collapsed ? 'px-3 flex justify-center' : 'px-6'}`}>
        {stage === 'skeleton' ? (
          <SkeletonBlock className={collapsed ? 'w-8 h-8' : 'w-[100px] h-[30px]'} />
        ) : collapsed ? (
          <Link href="/" title="ASKO">
            <Image src="/images/logo-icon.svg" alt="ASKO" width={28} height={28} />
          </Link>
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
      <nav className={`flex flex-col gap-1 flex-1 ${collapsed ? 'px-2' : 'px-4'}`}>
        {stage === 'skeleton' ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
              <SkeletonCircle className="w-5 h-5" />
              {!collapsed && <SkeletonBlock className="h-4 w-20" />}
            </div>
          ))
        ) : (
          menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2 text-sm tracking-[-0.01em] transition-colors ${
                  collapsed ? 'justify-center px-0' : 'px-2'
                } ${isActive
                  ? 'text-brand-red font-medium'
                  : 'text-text-main hover:text-brand-red'
                }`}
              >
                {stage === 'loaded' ? (
                  <MenuIcon icon={item.icon} active={isActive} />
                ) : (
                  <SkeletonCircle className="w-5 h-5" />
                )}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer: collapse toggle + back + logout */}
      <div className={`pb-6 flex flex-col gap-3 ${collapsed ? 'px-2 items-center' : 'px-4'}`}>
        {stage === 'loaded' ? (
          <>
            {!collapsed && (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                  Вернуться на сайт
                </Link>
                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Выйти
                </button>
              </>
            )}
            {collapsed && (
              <>
                <Link href="/" title="Вернуться на сайт" className="text-text-main hover:text-brand-red transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(true)}
                  title="Выйти"
                  className="text-text-main hover:text-brand-red transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Развернуть' : 'Свернуть'}
              className={`flex items-center gap-1 text-sm text-text-sub hover:text-text-main transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
            >
              {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-4 h-4" />}
              {!collapsed && <span>Свернуть</span>}
            </button>
          </>
        ) : (
          <>
            <SkeletonBlock className={collapsed ? 'h-5 w-5' : 'h-4 w-32'} />
            <SkeletonBlock className={collapsed ? 'h-5 w-5' : 'h-4 w-16'} />
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

// ─── Mobile Sidebar (swipeable drawer) ────────────────────────────────────────

export function MobileSidebar() {
  const pathname = usePathname();
  const { stage, user } = useAccount();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const menu = user ? menuByRole[primaryRole(user)] : [];
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const logout = useLogout();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    startTime: number;
    locked: boolean | null; // null=undecided, true=horizontal, false=vertical(abort)
  } | null>(null);
  const openRef = useRef(mobileOpen);
  openRef.current = mobileOpen;

  const applyTransform = useCallback((translateX: number, withTransition: boolean) => {
    const el = sidebarRef.current;
    const ov = overlayRef.current;
    if (el) {
      el.style.transition = withTransition ? 'transform 200ms ease-out' : 'none';
      el.style.transform = `translateX(${translateX}px)`;
    }
    if (ov) {
      const progress = Math.max(0, (translateX + SIDEBAR_WIDTH) / SIDEBAR_WIDTH);
      ov.style.transition = withTransition ? 'opacity 200ms ease-out' : 'none';
      ov.style.opacity = String(progress * 0.4);
      ov.style.pointerEvents = progress > 0 ? 'auto' : 'none';
    }
  }, []);

  // Sync transform when mobileOpen changes (hamburger toggle)
  useEffect(() => {
    applyTransform(mobileOpen ? 0 : -SIDEBAR_WIDTH, true);
  }, [mobileOpen, applyTransform]);

  // Edge swipe detection — touchstart on left edge opens, touch on sidebar/overlay closes
  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const isOpen = openRef.current;

      // Start tracking: left edge when closed, or anywhere when open
      if (!isOpen && touch.clientX <= EDGE_THRESHOLD) {
        dragRef.current = { startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, startTime: Date.now(), locked: null };
      } else if (isOpen) {
        dragRef.current = { startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, startTime: Date.now(), locked: null };
      }
    };

    const handleMove = (e: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const touch = e.touches[0];
      drag.currentX = touch.clientX;

      // Lock direction after 10px movement
      if (drag.locked === null) {
        const dx = Math.abs(touch.clientX - drag.startX);
        const dy = Math.abs(touch.clientY - drag.startY);
        if (dx > 10 || dy > 10) {
          drag.locked = dx > dy; // horizontal wins
          if (!drag.locked) { dragRef.current = null; return; }
        } else {
          return;
        }
      }

      const isOpen = openRef.current;
      const delta = touch.clientX - drag.startX;

      let translateX: number;
      if (!isOpen) {
        translateX = Math.min(0, Math.max(-SIDEBAR_WIDTH, -SIDEBAR_WIDTH + delta));
      } else {
        translateX = Math.min(0, Math.max(-SIDEBAR_WIDTH, delta));
      }

      applyTransform(translateX, false);
    };

    const handleEnd = () => {
      const drag = dragRef.current;
      if (!drag || drag.locked !== true) { dragRef.current = null; return; }

      const delta = drag.currentX - drag.startX;
      const duration = Date.now() - drag.startTime;
      const velocity = Math.abs(delta) / Math.max(duration, 1);
      const isOpen = openRef.current;

      let shouldOpen: boolean;
      if (!isOpen) {
        shouldOpen = delta > SIDEBAR_WIDTH * POSITION_THRESHOLD || velocity > VELOCITY_THRESHOLD;
      } else {
        shouldOpen = !(delta < -SIDEBAR_WIDTH * POSITION_THRESHOLD || (velocity > VELOCITY_THRESHOLD && delta < 0));
      }

      applyTransform(shouldOpen ? 0 : -SIDEBAR_WIDTH, true);
      // Defer state update to after transition starts
      requestAnimationFrame(() => {
        if (shouldOpen !== openRef.current) {
          setMobileOpen(shouldOpen);
        }
      });

      dragRef.current = null;
    };

    document.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [applyTransform, setMobileOpen]);

  return (
    <div className="lg:hidden">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black"
        style={{ opacity: 0, pointerEvents: 'none' }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <div
        ref={sidebarRef}
        className="fixed top-0 left-0 z-50 w-64 h-full bg-page-bg shadow-lg will-change-transform"
        style={{ transform: `translateX(-${SIDEBAR_WIDTH}px)` }}
      >
        {/* Logo */}
        <div className="px-4 pt-4 pb-6">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Image src="/images/logo.svg" alt="ASKO" width={80} height={24} />
            <span className="text-[10px] leading-3 text-brand-red tracking-[-0.01em]">
              Фирменный магазин
            </span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1 px-4">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-2 py-3 text-base tracking-[-0.01em] ${
                  isActive ? 'text-brand-red font-medium' : 'text-text-main'
                }`}
              >
                <MenuIcon icon={item.icon} active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 mt-8 flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1 text-sm text-text-main"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться на сайт
          </Link>
          <button
            type="button"
            onClick={() => { setMobileOpen(false); setLogoutDialogOpen(true); }}
            className="flex items-center gap-1 text-sm text-text-main cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
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
    </div>
  );
}
