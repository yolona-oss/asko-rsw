import type { ICertificate } from '@/lib/api/types';

export interface UserDevice {
  id: string;
  device?: { id?: string; name?: string; model?: string };
  serialNumber?: string;
  address?: {
    id?: string;
    city?: string;
    street?: string;
    validationStatus?: string;
    validationError?: string;
  };
}

export type Certificate = ICertificate;

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}
