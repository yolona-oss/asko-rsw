'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminArticles } from '@/components/account/admin/admin-articles';

export default function ArticlesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminArticles />;
}
