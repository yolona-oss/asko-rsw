'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminDevices } from '@/components/account/admin/admin-devices';

export default function DevicesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminDevices />;
}
