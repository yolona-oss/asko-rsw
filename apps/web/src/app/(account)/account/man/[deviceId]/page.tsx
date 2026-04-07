'use client';

import { use } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerManualDetail } from '@/components/account/repairer/repairer-manual-detail';

export default function ManualDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <RepairerManualDetail deviceId={deviceId} />;
}
