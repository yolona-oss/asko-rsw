import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { sleep, DeviceValidationStatus } from '@asko/shared';
import { UserDevice } from 'modules/device/entities/user-device.entity';
import type { UserDeviceValidationEvent } from 'modules/user-device-validation.service';
import { UserDeviceValidationPublisher } from 'modules/user-device-validation.service';
import { ExternalCertValidationService } from 'modules/certificate/services/external-cert-validation.service';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { buildDeviceValidationChain } from 'modules/device/validation';
import type { DeviceValidationContext } from 'modules/device/validation';

const MAX_RETRIES = 3;

@Controller()
export class UserDeviceValidationConsumer {
    constructor(
        private readonly em: EntityManager,
        private readonly validationPublisher: UserDeviceValidationPublisher,
        private readonly externalValidator: ExternalCertValidationService,
        private readonly repairEvents: RepairEventService,
    ) {}

    @EventPattern('user-device.validate')
    async handleValidation(@Payload() data: UserDeviceValidationEvent, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.validate(data);
            channel.ack(msg);
        } catch (e) {
            console.error(`[UserDeviceValidation] Error validating ${data.userDeviceId}:`, e);

            if (data.attempt < MAX_RETRIES) {
                const delay = Math.pow(2, data.attempt) * 1500;
                console.log(`[UserDeviceValidation] Retry ${data.attempt + 1}/${MAX_RETRIES} in ${delay}ms for ${data.userDeviceId}`);
                await sleep(delay);
                await this.validationPublisher.emit({ ...data, attempt: data.attempt + 1 });
            } else {
                console.error(`[UserDeviceValidation] Max retries reached for ${data.userDeviceId}, marking as error`);
                await this.markDevice(data.userDeviceId, DeviceValidationStatus.ERROR, 'Не удалось выполнить проверку: превышено число попыток');
            }

            channel.ack(msg);
        }
    }

    @CreateRequestContext()
    private async validate(data: UserDeviceValidationEvent): Promise<void> {
        const chain = buildDeviceValidationChain(this.em, this.externalValidator);

        const ctx: DeviceValidationContext = {
            userDeviceId: data.userDeviceId,
            deviceId: data.deviceId,
            serialNumber: data.serialNumber,
            invalid: false,
        };

        await chain.handle(ctx);

        if (ctx.invalid) {
            await this.markDevice(data.userDeviceId, DeviceValidationStatus.INVALID, ctx.errorMessage!);
            return;
        }

        const userDevice = await this.em.findOne(UserDevice, { id: data.userDeviceId }, { populate: ['device'] });
        if (userDevice) {
            userDevice.validationStatus = DeviceValidationStatus.VALID;
            userDevice.validationError = undefined;
            await this.em.flush();

            const deviceName = typeof userDevice.device === 'object' ? userDevice.device.name : '';

            await this.repairEvents.emitUserDeviceEvent({
                type: RepairEventType.USER_DEVICE_VALIDATED,
                userDeviceId: data.userDeviceId,
                userId: userDevice.userId,
                serialNumber: data.serialNumber,
                deviceName,
                timestamp: new Date(),
            });
        }

        console.log(`[UserDeviceValidation] Device ${data.userDeviceId} validated successfully`);
    }

    @CreateRequestContext()
    private async markDevice(userDeviceId: string, status: DeviceValidationStatus, error: string): Promise<void> {
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (userDevice) {
            userDevice.validationStatus = status;
            userDevice.validationError = error;
            await this.em.flush();

            if (status === DeviceValidationStatus.INVALID || status === DeviceValidationStatus.ERROR) {
                const deviceName = typeof userDevice.device === 'object' ? userDevice.device.name : '';

                await this.repairEvents.emitUserDeviceEvent({
                    type: RepairEventType.USER_DEVICE_VALIDATION_FAILED,
                    userDeviceId,
                    userId: userDevice.userId,
                    serialNumber: userDevice.serialNumber,
                    deviceName,
                    validationError: error,
                    timestamp: new Date(),
                });
            }
        }
        console.log(`[UserDeviceValidation] Device ${userDeviceId}: ${status} - ${error}`);
    }
}
