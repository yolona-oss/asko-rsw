import type { Image } from 'image/image.entity';

/** Extract all storage public_ids from an image (original + resized variants). */
export function collectPublicIds(image: Image): string[] {
    return Object.values(image.image)
        .filter(Boolean)
        .map((entry) => entry.public_id)
        .filter(Boolean);
}
