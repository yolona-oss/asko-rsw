import type { PartFormData, FormData } from './types';
import { UPLOAD_LIMITS } from '@asko/shared/client';

export const ACCEPTED_IMAGE_TYPES = UPLOAD_LIMITS.image.accept.split(',');
export const MAX_IMAGE_SIZE = UPLOAD_LIMITS.image.maxBytes;

export const EMPTY_PART_FORM: PartFormData = {
  name: '',
  partNumber: '',
  price: '',
  description: '',
};

export const INITIAL_DATA: FormData = {
  name: '',
  type: '',
  model: '',
  brand: 'ASKO',
  description: '',
  slug: '',
  isFeatured: false,
};

