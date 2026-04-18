import { msg } from '@asko/shared';
import { AddressValidationHandler } from '../address-validation-handler';
import type { AddressValidationContext } from '../address-validation-context';

const RUSSIA_BOUNDS = { latMin: 41, latMax: 82, lonMin: 19, lonMax: 180 };

export class RussiaBoundsHandler extends AddressValidationHandler {
    protected async process(ctx: AddressValidationContext): Promise<void> {
        const { inputLatitude: lat, inputLongitude: lon } = ctx;
        if (lat == null || lon == null || lat === 0 || lon === 0) return;

        if (
            lat < RUSSIA_BOUNDS.latMin || lat > RUSSIA_BOUNDS.latMax ||
            lon < RUSSIA_BOUNDS.lonMin || lon > RUSSIA_BOUNDS.lonMax
        ) {
            ctx.invalid = true;
            ctx.errorMessage = msg.validation.coordsOutOfBounds;
        }
    }
}
