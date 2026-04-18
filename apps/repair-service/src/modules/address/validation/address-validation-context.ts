import type { ValidationContext } from 'common/validation';

export interface AddressValidationContext extends ValidationContext {
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

    /** Resolved timezone (set by TimezoneHandler). */
    resolvedTimezone?: string;
}
