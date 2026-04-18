import { AppErrors } from 'common/error';

const VALID = 'valid';
const INVALID = 'invalid';
const ERROR = 'error';

/**
 * Assert that an entity with async validation status has passed validation.
 * No-op if entity is null/undefined. Throws AppErrors.badRequest for non-valid statuses.
 *
 * @param entity - Any entity with validationStatus + validationError fields
 * @param label  - Russian noun for error messages (e.g. 'Адрес', 'Устройство')
 */
export function assertValidationStatus(
    entity: { validationStatus: string; validationError?: string } | null | undefined,
    label: string,
): void {
    if (!entity) return;

    switch (entity.validationStatus) {
        case VALID:
            return;
        case INVALID:
            throw AppErrors.badRequest(
                `${label} не прошёл проверку: ${entity.validationError || 'проверка не пройдена'}`,
            );
        case ERROR:
            throw AppErrors.badRequest(
                `Не удалось проверить ${label.toLowerCase()}. Попробуйте обновить данные.`,
            );
        default:
            // pending or unknown
            throw AppErrors.badRequest(
                `${label} ещё проходит проверку. Попробуйте через несколько секунд.`,
            );
    }
}

export const assertAddressValid = (
    entity: { validationStatus: string; validationError?: string } | null | undefined,
) => assertValidationStatus(entity, 'Адрес');

export const assertDeviceValid = (
    entity: { validationStatus: string; validationError?: string } | null | undefined,
) => assertValidationStatus(entity, 'Устройство');

type ValidatableEntity = { validationStatus: string; validationError?: string };

/**
 * Cascading check: device valid + its address valid.
 * Use this wherever a UserDevice must be fully validated before proceeding.
 */
export function assertUserDeviceReady(
    device: (ValidatableEntity & { address?: ValidatableEntity | unknown }) | null | undefined,
): void {
    if (!device) return;
    assertDeviceValid(device);
    const address = typeof device.address === 'object' ? device.address as ValidatableEntity : null;
    assertAddressValid(address);
}
