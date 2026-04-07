'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminArticleForm } from '@/components/account/admin/admin-article-form';

export default function ArticleCreatePage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminArticleForm />;
}
