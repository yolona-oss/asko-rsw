import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { sleep, AddressValidationStatus } from '@asko/shared';
import { Address } from 'modules/device/entities/address.entity';
import type { AddressValidationEvent } from 'modules/address-validation.service';
import { AddressValidationPublisher } from 'modules/address-validation.service';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { buildAddressValidationChain } from 'modules/address/validation';
import type { AddressValidationContext } from 'modules/address/validation';

const MAX_RETRIES = 3;

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

            if (data.attempt < MAX_RETRIES) {
                const delay = Math.pow(2, data.attempt) * 1500;
                console.log(`[AddressValidation] Retry ${data.attempt + 1}/${MAX_RETRIES} in ${delay}ms for ${data.addressId}`);
                await sleep(delay);
                await this.validationPublisher.emit({ ...data, attempt: data.attempt + 1 });
            } else {
                console.error(`[AddressValidation] Max retries reached for ${data.addressId}, marking as error`);
                await this.markAddress(data.addressId, AddressValidationStatus.ERROR, 'Не удалось выполнить валидацию: превышено число попыток');
            }

            channel.ack(msg);
        }
    }

    @CreateRequestContext()
    private async validate(data: AddressValidationEvent): Promise<void> {
        const chain = buildAddressValidationChain();

        const ctx: AddressValidationContext = {
            addressId: data.addressId,
            city: data.city,
            street: data.street,
            house: data.house,
            inputLatitude: data.latitude,
            inputLongitude: data.longitude,
            invalid: false,
        };

        await chain.handle(ctx);

        if (ctx.invalid) {
            await this.markAddress(data.addressId, AddressValidationStatus.INVALID, ctx.errorMessage!);
            return;
        }

        const address = await this.em.findOne(Address, { id: data.addressId });
        if (address) {
            address.validationStatus = AddressValidationStatus.VALID;
            address.validationError = undefined;

            if ((address.latitude == null || address.latitude === 0) && ctx.nominatimLatitude != null) {
                address.latitude = ctx.nominatimLatitude;
            }
            if ((address.longitude == null || address.longitude === 0) && ctx.nominatimLongitude != null) {
                address.longitude = ctx.nominatimLongitude;
            }
            if (ctx.resolvedTimezone) {
                address.timezone = ctx.resolvedTimezone;
            }
            await this.em.flush();

            await this.repairEvents.emitAddressEvent({
                type: RepairEventType.ADDRESS_VALIDATED,
                addressId: data.addressId,
                userId: address.userId,
                city: address.city,
                street: address.street,
                house: address.house,
                timestamp: new Date(),
            });
        }

        console.log(`[AddressValidation] Address ${data.addressId} validated successfully`);
    }

    @CreateRequestContext()
    private async markAddress(addressId: string, status: AddressValidationStatus, error: string): Promise<void> {
        const address = await this.em.findOne(Address, { id: addressId });
        if (address) {
            address.validationStatus = status;
            address.validationError = error;
            await this.em.flush();

            if (status === AddressValidationStatus.INVALID || status === AddressValidationStatus.ERROR) {
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
