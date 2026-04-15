'use client';

import { useMemo } from 'react';
import type { MenuItem } from '@/lib/account';

export interface ResolvedMenu {
  items: MenuItem[];
  parent: MenuItem | null;
  backHref: string;
}

function findBestMatch(items: MenuItem[], pathname: string): MenuItem | null {
  let best: MenuItem | null = null;
  let bestLen = 0;
  for (const item of items) {
    if (!item.children) continue;
    const href = item.href;
    if ((pathname === href || pathname.startsWith(href + '/')) && href.length > bestLen) {
      best = item;
      bestLen = href.length;
    }
  }
  return best;
}

export function useResolvedMenu(menu: MenuItem[], pathname: string): ResolvedMenu {
  return useMemo(() => {
    const parents: MenuItem[] = [];
    let current = menu;

    // Walk down the tree, collecting matching parents at each level
    for (;;) {
      const match = findBestMatch(current, pathname);
      if (!match) break;
      parents.push(match);
      current = match.children!;
    }

    if (parents.length === 0) {
      return { items: menu, parent: null, backHref: '/account' };
    }

    const parent = parents[parents.length - 1];
    const backHref = parents.length === 1
      ? '/account'
      : parents[parents.length - 2].href;

    return { items: current, parent, backHref };
  }, [menu, pathname]);
}
