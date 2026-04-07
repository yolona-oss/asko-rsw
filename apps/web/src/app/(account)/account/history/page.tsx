'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerHistory } from '@/components/account/repairer/history';

export default function HistoryPage() {
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <RepairerHistory />;
}
