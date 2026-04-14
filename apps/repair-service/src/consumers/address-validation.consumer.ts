import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { sleep } from '@asko/shared';
import { Address } from 'entities/address.entity';
import type { AddressValidationEvent } from 'modules/address-validation.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';
import { RepairEventService, RepairEventType } from 'modules/repair-event.service';

const MAX_RETRIES = 3;
const RUSSIA_BOUNDS = { latMin: 41, latMax: 82, lonMin: 19, lonMax: 180 };
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

@Controller()
export class AddressValidationConsumer {
    constructor(
        private readonly em: EntityManager,
        private readonly validationPublisher: AddressValidationPublisher,
        private readonly repairEvents: RepairEventService,
    ) {}

    @EventPattern('address.validate')
    async handleValidation(@Payload() data: AddressValidationEvent, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.validate(data);
            channel.ack(msg);
        } catch (e) {
            console.error(`[AddressValidation] Error validating ${data.addressId}:`, e);

            // If rate-limited or network error, requeue with backoff
            if (data.attempt < MAX_RETRIES) {
                const delay = Math.pow(2, data.attempt) * 1500; // 1.5s, 3s, 6s
                console.log(`[AddressValidation] Retry ${data.attempt + 1}/${MAX_RETRIES} in ${delay}ms for ${data.addressId}`);
                await sleep(delay);
                await this.validationPublisher.emit({ ...data, attempt: data.attempt + 1 });
            } else {
                console.error(`[AddressValidation] Max retries reached for ${data.addressId}, marking as error`);
                await this.markAddress(data.addressId, 'error', 'Не удалось выполнить валидацию: превышено число попыток');
            }

            channel.ack(msg);
        }
    }

    @CreateRequestContext()
    private async validate(data: AddressValidationEvent): Promise<void> {
        const { addressId, city, street, house, latitude, longitude } = data;

        // 1. Russia bounds check (if coords provided)
        if (latitude != null && longitude != null && latitude !== 0 && longitude !== 0) {
            if (
                latitude < RUSSIA_BOUNDS.latMin || latitude > RUSSIA_BOUNDS.latMax ||
                longitude < RUSSIA_BOUNDS.lonMin || longitude > RUSSIA_BOUNDS.lonMax
            ) {
                await this.markAddress(addressId, 'invalid', 'Координаты находятся за пределами России');
                return;
            }
        }

        // 2. Forward geocode: verify address exists via Nominatim
        const query = [city, street, house].filter(Boolean).join(', ');
        const searchUrl =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&format=json&addressdetails=1` +
            `&accept-language=ru&countrycodes=ru&limit=1`;

        const res = await fetch(searchUrl, {
            headers: { 'User-Agent': 'ASKO-RepairService/1.0 (askoservis.ru)' },
        });

        // Handle rate limiting
        if (res.status === 429) {
            throw new Error('Nominatim rate limited (429)');
        }

        if (!res.ok) {
            throw new Error(`Nominatim error: ${res.status}`);
        }

        const results = await res.json();

        if (!results || results.length === 0) {
            await this.markAddress(addressId, 'invalid', 'Адрес не найден в базе OpenStreetMap');
            return;
        }

        // 3. Coords consistency check
        const nominatimLat = parseFloat(results[0].lat);
        const nominatimLon = parseFloat(results[0].lon);

        if (latitude != null && longitude != null && latitude !== 0 && longitude !== 0) {
            const distance = haversineKm(latitude, longitude, nominatimLat, nominatimLon);
            if (distance > MAX_DISTANCE_KM) {
                await this.markAddress(
                    addressId,
                    'invalid',
                    `Координаты не соответствуют адресу (расхождение ${distance.toFixed(1)} км)`,
                );
                return;
            }
        }

        // 4. If coords were missing, store Nominatim's coords
        const address = await this.em.findOne(Address, { id: addressId });
        if (address) {
            address.validationStatus = 'valid';
            address.validationError = undefined;
            if ((address.latitude == null || address.latitude === 0) && Number.isFinite(nominatimLat)) {
                address.latitude = nominatimLat;
            }
            if ((address.longitude == null || address.longitude === 0) && Number.isFinite(nominatimLon)) {
                address.longitude = nominatimLon;
            }
            await this.em.flush();

            await this.repairEvents.emitAddressEvent({
                type: RepairEventType.ADDRESS_VALIDATED,
                addressId,
                userId: address.userId,
                city: address.city,
                street: address.street,
                house: address.house,
                timestamp: new Date(),
            });
        }

        console.log(`[AddressValidation] Address ${addressId} validated successfully`);
    }

    @CreateRequestContext()
    private async markAddress(addressId: string, status: string, error: string): Promise<void> {
        const address = await this.em.findOne(Address, { id: addressId });
        if (address) {
            address.validationStatus = status;
            address.validationError = error;
            await this.em.flush();

            if (status === 'invalid' || status === 'error') {
                await this.repairEvents.emitAddressEvent({
                    type: RepairEventType.ADDRESS_VALIDATION_FAILED,
                    addressId,
                    userId: address.userId,
                    city: address.city,
                    street: address.street,
                    house: address.house,
                    validationError: error,
                    timestamp: new Date(),
                });
            }
        }
        console.log(`[AddressValidation] Address ${addressId}: ${status} - ${error}`);
    }
}
