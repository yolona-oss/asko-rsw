/** Allowed certificate duration options in months */
export const CERTIFICATE_DURATION_OPTIONS = [6, 10, 12, 18, 24, 36, 60] as const;

export type CertificateDurationMonths = (typeof CERTIFICATE_DURATION_OPTIONS)[number];

/** Human-readable labels for certificate durations */
export const CERTIFICATE_DURATION_LABELS: Record<CertificateDurationMonths, string> = {
    6: '6 месяцев',
    10: '10 месяцев',
    12: '1 год',
    18: '18 месяцев',
    24: '2 года',
    36: '3 года',
    60: '5 лет',
};

/** Compute expiresAt from durationMonths, rounded to 23:59:59.999 of the last day */
export function computeExpiresAt(durationMonths: number): Date {
    const now = new Date();
    const expires = new Date(now.getFullYear(), now.getMonth() + durationMonths, now.getDate());
    // Round to end of day
    expires.setHours(23, 59, 59, 999);
    return expires;
}
