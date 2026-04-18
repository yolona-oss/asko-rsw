import { AddressValidationHandler } from '../address-validation-handler';
import type { AddressValidationContext } from '../address-validation-context';
import { resolveTimezoneFromCoords } from 'common/timezone-lookup';

export class TimezoneHandler extends AddressValidationHandler {
    protected async process(ctx: AddressValidationContext): Promise<void> {
        const lon = ctx.nominatimLongitude ?? ctx.inputLongitude;
        if (lon != null && Number.isFinite(lon)) {
            ctx.resolvedTimezone = resolveTimezoneFromCoords(0, lon);
        }
    }
}
