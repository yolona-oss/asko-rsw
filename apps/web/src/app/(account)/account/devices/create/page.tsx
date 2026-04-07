'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminDeviceForm } from '@/components/account/admin/device-form';

export default function DeviceCreatePage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminDeviceForm />;
}
