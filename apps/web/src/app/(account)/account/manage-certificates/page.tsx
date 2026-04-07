'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminCertificates } from '@/components/account/admin/admin-certificates';

export default function ManageCertificatesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminCertificates />;
}
