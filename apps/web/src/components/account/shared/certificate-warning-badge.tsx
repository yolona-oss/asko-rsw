import { AlertTriangle } from 'lucide-react';

interface CertificateWarningBadgeProps {
  valid?: boolean;
  /** Live certificate data — when the cert is currently active (paid, not expired/revoked),
   *  suppress the warning even if `valid` is still false from request creation time.
   *  Ignored when a snapshot exists (completed requests use the frozen state). */
  certificate?: { paid?: boolean; status?: string; expiresAt?: string } | null;
  /** When a snapshot exists the request is in a terminal state — the frozen
   *  `valid` flag is authoritative and the live cert must not override it. */
  hasSnapshot?: boolean;
}

function isCertCurrentlyActive(cert: CertificateWarningBadgeProps['certificate']): boolean {
  if (!cert) return false;
  if (!cert.paid) return false;
  if (cert.status === 'revoked' || cert.status === 'expired') return false;
  if (cert.expiresAt && new Date(cert.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export function CertificateWarningBadge({ valid, certificate, hasSnapshot }: CertificateWarningBadgeProps) {
  if (valid !== false) return null;
  if (!hasSnapshot && isCertCurrentlyActive(certificate)) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-error-bg text-error border border-error-border">
      <AlertTriangle className="w-3 h-3" />
      Сертификат не подтверждён
    </span>
  );
}
