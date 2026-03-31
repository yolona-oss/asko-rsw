export type PlaceholderCategory = 'device' | 'article';

const VARIANT_COUNT = 11; // 0–10

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic placeholder image path for the given category.
 * Pass `id` (entity id) or `index` (array position) to pick a variant;
 * the same input always yields the same image.
 */
export function getPlaceholderSrc(
  category: PlaceholderCategory,
  idOrIndex?: string | number,
): string {
  let variant = 0;
  if (typeof idOrIndex === 'number') {
    variant = ((idOrIndex % VARIANT_COUNT) + VARIANT_COUNT) % VARIANT_COUNT;
  } else if (typeof idOrIndex === 'string' && idOrIndex.length > 0) {
    variant = hashId(idOrIndex) % VARIANT_COUNT;
  }
  return `/images/placeholders/placeholder-${category}-${variant}.webp`;
}
