'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerManuals } from '@/components/account/repairer/repairer-manuals';

export default function ManualsPage() {
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <RepairerManuals />;
}
