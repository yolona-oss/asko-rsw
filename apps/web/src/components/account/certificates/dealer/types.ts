import { CertificateStatus } from '@asko/shared/client';
import type { CertificateRecord } from '@/lib/api/types';

export type StatusFilter = 'all' | CertificateStatus;

export type SortField = 'createdAt' | 'expiresAt' | 'certificateNumber';

export type Certificate = CertificateRecord;
