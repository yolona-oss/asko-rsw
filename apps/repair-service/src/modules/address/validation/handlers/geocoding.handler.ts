import { msg } from '@asko/shared';
import { AddressValidationHandler } from '../address-validation-handler';
import type { AddressValidationContext } from '../address-validation-context';

export class GeocodingHandler extends AddressValidationHandler {
    protected async process(ctx: AddressValidationContext): Promise<void> {
        const query = [ctx.city, ctx.street, ctx.house].filter(Boolean).join(', ');
        const searchUrl =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&format=json&addressdetails=1` +
            `&accept-language=ru&countrycodes=ru&limit=1`;

        const res = await fetch(searchUrl, {
            headers: { 'User-Agent': 'ASKO-RepairService/1.0 (askoservis.ru)' },
        });

        if (res.status === 429) throw new Error('Nominatim rate limited (429)');
        if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

        const results = await res.json();
        if (!results || results.length === 0) {
            ctx.invalid = true;
            ctx.errorMessage = msg.validation.addressNotFound;
            return;
        }

        ctx.nominatimLatitude = parseFloat(results[0].lat);
        ctx.nominatimLongitude = parseFloat(results[0].lon);
    }
}
