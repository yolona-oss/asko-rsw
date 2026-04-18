import type { EntityManager } from '@mikro-orm/postgresql';
import { DeviceValidationStatus } from '@asko/shared';
import { ValidationHandler } from 'common/validation';
import { UserDevice } from 'modules/device/entities/user-device.entity';
import type { DeviceValidationContext } from '../device-validation-context';

export class DuplicateCheckHandler extends ValidationHandler<DeviceValidationContext> {
    constructor(private readonly em: EntityManager) {
        super();
    }

    protected async process(ctx: DeviceValidationContext): Promise<void> {
        const duplicate = await this.em.findOne(UserDevice, {
            device: ctx.deviceId,
            serialNumber: ctx.serialNumber,
            id: { $ne: ctx.userDeviceId },
            validationStatus: { $ne: DeviceValidationStatus.INVALID },
        });

        if (duplicate) {
            ctx.invalid = true;
            ctx.errorMessage = 'Устройство с таким серийным номером уже зарегистрировано';
        }
    }
}
