'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Manager has no dedicated dashboard in the Figma designs.
 * Redirect to the requests page which is their main workspace.
 */
export function ManagerDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/requests');
  }, [router]);

  return null;
}
