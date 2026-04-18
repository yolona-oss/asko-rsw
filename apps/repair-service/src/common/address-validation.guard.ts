import { AddressValidationStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

/**
 * Assert that an address has passed async validation.
 * No-op if address is null/undefined. Throws AppErrors.badRequest for non-valid statuses.
 */
export function assertAddressValid(
    address: { validationStatus: string; validationError?: string } | null | undefined,
): void {
    if (!address) return;

    switch (address.validationStatus) {
        case AddressValidationStatus.VALID:
            return;
        case AddressValidationStatus.INVALID:
            throw AppErrors.badRequest(
                'Адрес не прошёл проверку: ' + (address.validationError || 'адрес не найден'),
            );
        case AddressValidationStatus.PENDING:
            throw AppErrors.badRequest(
                'Адрес ещё проходит проверку. Попробуйте через несколько секунд.',
            );
        case AddressValidationStatus.ERROR:
            throw AppErrors.badRequest(
                'Не удалось проверить адрес. Попробуйте обновить адрес.',
            );
        default:
            throw AppErrors.badRequest(
                'Адрес ещё проходит проверку. Попробуйте через несколько секунд.',
            );
    }
}
