/**
 * Mutable context object passed through the validation chain.
 * Each handler reads from it and may enrich it (e.g., fill coords, set timezone).
 */
export interface AddressValidationContext {
    addressId: string;

    city: string;
    street: string;
    house: string;

    /** Coords supplied by the user (may be undefined). */
    inputLatitude?: number;
    inputLongitude?: number;

    /** Coords resolved by geocoding (set by GeocodingHandler). */
    nominatimLatitude?: number;
    nominatimLongitude?: number;

    /** Set to true by any handler that considers the address invalid. */
    invalid: boolean;
    errorMessage?: string;

    /** Resolved timezone (set by TimezoneHandler). */
    resolvedTimezone?: string;
}
