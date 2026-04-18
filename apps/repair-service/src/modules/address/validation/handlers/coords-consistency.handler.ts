import { msg } from '@asko/shared';
import { AddressValidationHandler } from '../address-validation-handler';
import type { AddressValidationContext } from '../address-validation-context';

const MAX_DISTANCE_KM = 2;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class CoordsConsistencyHandler extends AddressValidationHandler {
    protected async process(ctx: AddressValidationContext): Promise<void> {
        const { inputLatitude: lat, inputLongitude: lon, nominatimLatitude: nLat, nominatimLongitude: nLon } = ctx;
        if (lat == null || lon == null || lat === 0 || lon === 0) return;
        if (nLat == null || nLon == null) return;

        const distance = haversineKm(lat, lon, nLat, nLon);
        if (distance > MAX_DISTANCE_KM) {
            ctx.invalid = true;
            ctx.errorMessage = msg.validation.coordsMismatch;
        }
    }
}
