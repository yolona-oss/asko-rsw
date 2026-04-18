/**
 * Storage-agnostic image entry metadata. Stores dimensions, URLs, and
 * provider-specific identifiers for a single image variant (original,
 * thumbnail, medium, large).
 */
export class IImageEntry {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    url: string;
    secure_url: string;
    original_filename: string;
}
