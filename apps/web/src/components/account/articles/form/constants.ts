import { UPLOAD_LIMITS } from '@asko/shared/client';

export const ACCEPTED_IMAGE_TYPES = UPLOAD_LIMITS.image.accept.split(',');
export const MAX_IMAGE_SIZE = UPLOAD_LIMITS.image.maxBytes;
