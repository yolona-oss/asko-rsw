import { AddressValidationHandler } from './address-validation-handler';
import { RussiaBoundsHandler } from './handlers/russia-bounds.handler';
import { GeocodingHandler } from './handlers/geocoding.handler';
import { CoordsConsistencyHandler } from './handlers/coords-consistency.handler';
import { TimezoneHandler } from './handlers/timezone.handler';

/**
 * Build the address validation chain in canonical order.
 * Returns the head handler — call head.handle(ctx) to execute the full chain.
 *
 * To add a new validation step, instantiate the handler and link it in order.
 */
export function buildAddressValidationChain(): AddressValidationHandler {
    const russiaBounds = new RussiaBoundsHandler();
    const geocoding = new GeocodingHandler();
    const coordsConsistency = new CoordsConsistencyHandler();
    const timezone = new TimezoneHandler();

    russiaBounds
        .setNext(geocoding)
        .setNext(coordsConsistency)
        .setNext(timezone);

    return russiaBounds;
}
