'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormGuardContext } from './form-guard-context';
import type { ComponentProps, MouseEvent } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export function GuardedLink({ href, onClick, ...props }: LinkProps) {
  const { getGuard } = useFormGuardContext();
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const guard = getGuard();
    if (guard?.dirty) {
      e.preventDefault();
      guard.confirmLeave().then((confirmed) => {
        if (confirmed) {
          // Call the original onClick (e.g. mobile sidebar close) before navigating
          if (onClick) {
            (onClick as (e: MouseEvent<HTMLAnchorElement>) => void)(e);
          }
          router.push(typeof href === 'string' ? href : href.pathname ?? '/');
        }
      });
      return;
    }
    // If not dirty, let Link handle navigation normally
    if (onClick) {
      (onClick as (e: MouseEvent<HTMLAnchorElement>) => void)(e);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
