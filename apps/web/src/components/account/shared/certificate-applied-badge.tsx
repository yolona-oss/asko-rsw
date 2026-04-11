import { BadgeCheck } from 'lucide-react';

interface CertificateSnapshotLike {
  expiresAt: string;
  status?: string;
}

interface CertificateAppliedBadgeProps {
  valid?: boolean;
  /** Frozen snapshot taken at request completion. When present, drives historical
   *  display so later cert revocation/expiry doesn't rewrite the badge. */
  snapshot?: CertificateSnapshotLike | null;
  /** Live cert expiry — used as fallback for in-progress requests where the
   *  snapshot has not been frozen yet. */
  expiresAt?: string | Date | null;
}

export function CertificateAppliedBadge({ valid, snapshot, expiresAt }: CertificateAppliedBadgeProps) {
  if (valid !== true) return null;

  const effectiveExpires = snapshot?.expiresAt ?? expiresAt ?? null;
  const expired = !!effectiveExpires && new Date(effectiveExpires).getTime() < Date.now();
  const revoked = snapshot?.status === 'revoked';

  let label: string;
  if (snapshot) {
    label = revoked
      ? 'Сертификат применён (отозван позже)'
      : expired
        ? 'Сертификат применён (истёк)'
        : 'Сертификат применён';
  } else {
    label = expired ? 'Сертификат применён (истёк)' : 'Сертификат применён';
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-success-bg text-success border border-success-border">
      <BadgeCheck className="w-3 h-3" />
      {label}
    </span>
  );
}
