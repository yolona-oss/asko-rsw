/**
 * Convert text to a URL-safe slug.
 * Handles Latin and Cyrillic characters, collapses dashes, trims edges.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}
