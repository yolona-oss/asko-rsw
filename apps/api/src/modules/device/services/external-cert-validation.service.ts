import { Injectable } from '@nestjs/common';
import { AppErrors } from 'common/error';

/**
 * External factory serial number validation service.
 * Validates serial numbers against an external factory database.
 */
@Injectable()
export class ExternalCertValidationService {
    /**
     * Validates the serial number against the external factory database.
     * Throws an error if the serial number is not valid.
     */
    async externalFactorySerialNumberValidator(serialNumber: string): Promise<void> {
        // TODO: Implement actual external factory DB lookup.
        // This should call an external service/API to verify
        // that the serial number exists in the factory records.
        //
        // Example:
        // const result = await this.httpService.get(`${FACTORY_API_URL}/validate/${serialNumber}`);
        // if (!result.data.valid) {
        //     throw AppErrors.badRequest(`Serial number ${serialNumber} not found in factory records`);
        // }

        if (!serialNumber || serialNumber.trim().length === 0) {
            throw AppErrors.badRequest('Serial number is required for validation');
        }

        // Placeholder: accept all non-empty serial numbers
        // Replace with actual external validation logic
    }
}
