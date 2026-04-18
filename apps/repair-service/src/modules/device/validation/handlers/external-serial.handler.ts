import { msg } from '@asko/shared';
import { ValidationHandler } from 'common/validation';
import type { ExternalCertValidationService } from 'modules/certificate/services/external-cert-validation.service';
import type { DeviceValidationContext } from '../device-validation-context';

export class ExternalSerialHandler extends ValidationHandler<DeviceValidationContext> {
    constructor(private readonly externalValidator: ExternalCertValidationService) {
        super();
    }

    protected async process(ctx: DeviceValidationContext): Promise<void> {
        const result = await this.externalValidator.validateSerialNumber(ctx.serialNumber);
        if (!result.valid) {
            ctx.invalid = true;
            ctx.errorMessage = result.reason || msg.validation.deviceSerialFailed;
        }
    }
}
