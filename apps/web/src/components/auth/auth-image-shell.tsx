'use client';

import Image from 'next/image';
import { Sun, Moon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectTheme, toggleTheme } from '@/store/preferences';
import { LandingHeader } from '@/components/landing/header';

interface AuthImageShellProps {
  children: (variant: 'mobile' | 'desktop') => React.ReactNode;
}

export function AuthImageShell({ children }: AuthImageShellProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <LandingHeader />
        <div className="relative flex-1 flex flex-col">
          <div className="absolute inset-0">
            <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-dark-deep/65" />
          </div>
          <div className="relative z-10 flex flex-col flex-1 px-4 pt-8 pb-10">
            <div className="flex-1">{children('mobile')}</div>
            <div className="flex justify-center mt-8">
              <Image src="/images/logo.svg" alt="ASKO" width={280} height={84} className="brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg py-10">
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="fixed top-4 right-4 z-50 p-2 text-text-sub hover:text-text-main bg-surface border border-border rounded-full shadow-sm transition-colors cursor-pointer"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <div className="relative w-[1120px] min-h-[676px] bg-surface flex">
          <div className="flex items-center w-[569px] px-6 py-10">
            <div className="w-[446px]">
              {children('desktop')}
            </div>
          </div>
          <div className="relative w-[551px] flex flex-col justify-end items-center pb-10 overflow-hidden">
            <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
            <div className="relative z-10">
              <Image src="/images/logo.svg" alt="ASKO" width={494} height={148} className="brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
