import type { IImageAttachment } from '@/lib/api/types';
import { getImageUrl as getFileImageUrl } from '@/lib/file-url';

type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Returns the access-controlled URL for an image attachment.
 * Uses the authenticated file endpoint when an image ID is available,
 * falling back to extracting secure_url from imageJson for legacy data.
 */
export function getImageUrl(
    image: IImageAttachment | null | undefined,
    _size: ImageSize = 'medium',
): string | null {
    if (!image) return null;

    // Prefer access-controlled URL via image entity ID
    if (image.id) return getFileImageUrl(image.id);

    // Fallback for legacy data without ID
    const json = image.imageJson;
    if (!json?.original) return null;
    return json.original.secure_url;
}
