import { AlertTriangle } from 'lucide-react';

export function CertificateWarningBadge({ valid }: { valid?: boolean }) {
  if (valid !== false) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-brand-red border border-red-200">
      <AlertTriangle className="w-3 h-3" />
      Сертификат не подтверждён
    </span>
  );
}
