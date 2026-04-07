'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminDeviceCategories } from '@/components/account/admin/device-categories/admin-device-categories';

export default function DeviceCategoriesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminDeviceCategories />;
}
