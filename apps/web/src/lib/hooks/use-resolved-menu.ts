'use client';

import { useMemo } from 'react';
import type { MenuItem } from '@/lib/account';

export interface ResolvedMenu {
  items: MenuItem[];
  parent: MenuItem | null;
}

export function useResolvedMenu(menu: MenuItem[], pathname: string): ResolvedMenu {
  return useMemo(() => {
    let match: MenuItem | null = null;
    let matchLen = 0;

    for (const item of menu) {
      if (!item.children) continue;
      const href = item.href;
      const isPrefix = pathname === href || pathname.startsWith(href + '/');
      if (isPrefix && href.length > matchLen) {
        match = item;
        matchLen = href.length;
      }
    }

    if (match) {
      return { items: match.children!, parent: match };
    }
    return { items: menu, parent: null };
  }, [menu, pathname]);
}
