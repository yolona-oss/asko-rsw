import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { sleep } from '@asko/shared';
import { UserDevice } from 'entities/user-device.entity';
import type { UserDeviceValidationEvent } from 'modules/user-device-validation.service';
import { UserDeviceValidationPublisher } from 'modules/user-device-validation.service';
import { ExternalCertValidationService } from 'services/external-cert-validation.service';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';

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
                await this.markDevice(data.userDeviceId, 'error', 'Не удалось выполнить проверку: превышено число попыток');
            }

            channel.ack(msg);
        }
    }

    @CreateRequestContext()
    private async validate(data: UserDeviceValidationEvent): Promise<void> {
        const { userDeviceId, deviceId, serialNumber } = data;

        // 1. Duplicate check: same device model + same serial number (excluding self)
        const duplicate = await this.em.findOne(UserDevice, {
            device: deviceId,
            serialNumber,
            id: { $ne: userDeviceId },
            validationStatus: { $ne: 'invalid' },
        });

        if (duplicate) {
            await this.markDevice(
                userDeviceId,
                'invalid',
                'Устройство с таким серийным номером уже зарегистрировано',
            );
            return;
        }

        // 2. External serial number validation
        const externalResult = await this.externalValidator.validateSerialNumber(serialNumber);
        if (!externalResult.valid) {
            await this.markDevice(
                userDeviceId,
                'invalid',
                externalResult.reason || 'Серийный номер не прошёл внешнюю проверку',
            );
            return;
        }

        // 3. Mark as valid
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (userDevice) {
            userDevice.validationStatus = 'valid';
            userDevice.validationError = undefined;
            await this.em.flush();

            const deviceName = typeof userDevice.device === 'object' ? userDevice.device.name : '';

            await this.repairEvents.emitUserDeviceEvent({
                type: RepairEventType.USER_DEVICE_VALIDATED,
                userDeviceId,
                userId: userDevice.userId,
                serialNumber,
                deviceName,
                timestamp: new Date(),
            });
        }

        console.log(`[UserDeviceValidation] Device ${userDeviceId} validated successfully`);
    }

    @CreateRequestContext()
    private async markDevice(userDeviceId: string, status: string, error: string): Promise<void> {
        const userDevice = await this.em.findOne(UserDevice, { id: userDeviceId }, { populate: ['device'] });
        if (userDevice) {
            userDevice.validationStatus = status;
            userDevice.validationError = error;
            await this.em.flush();

            if (status === 'invalid' || status === 'error') {
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
