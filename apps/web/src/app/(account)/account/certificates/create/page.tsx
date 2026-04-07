'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { CertificateWizard } from '@/components/account/dealer/certificate-wizard';

export default function CreateCertificatePage() {
  const allowed = useRoleGuard(['dealer']);

  if (!allowed) return null;

  return <CertificateWizard />;
}
