'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminUsers } from '@/components/account/admin/users';

export default function UsersPage() {
  const allowed = useRoleGuard(['admin', 'manager']);

  if (!allowed) return null;

  return <AdminUsers />;
}
