import type { EntityManager } from '@mikro-orm/postgresql';
import type { ValidationHandler } from 'common/validation';
import type { ExternalCertValidationService } from 'modules/certificate/services/external-cert-validation.service';
import { DuplicateCheckHandler } from './handlers/duplicate-check.handler';
import { ExternalSerialHandler } from './handlers/external-serial.handler';
import type { DeviceValidationContext } from './device-validation-context';

/**
 * Build the device validation chain.
 * Returns the head handler — call head.handle(ctx) to execute the full chain.
 *
 * To add a new validation step, instantiate the handler and link it in order.
 */
export function buildDeviceValidationChain(
    em: EntityManager,
    externalValidator: ExternalCertValidationService,
): ValidationHandler<DeviceValidationContext> {
    const duplicateCheck = new DuplicateCheckHandler(em);
    const externalSerial = new ExternalSerialHandler(externalValidator);

    duplicateCheck.setNext(externalSerial);

    return duplicateCheck;
}
