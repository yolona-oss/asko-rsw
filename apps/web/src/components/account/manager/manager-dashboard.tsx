'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ManagerDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/requests');
  }, [router]);

  return null;
}
