import { Injectable } from '@nestjs/common';
import { AppErrors } from 'common/error';

@Injectable()
export class ExternalCertValidationService {
    async externalFactorySerialNumberValidator(serialNumber: string): Promise<void> {
        if (!serialNumber || serialNumber.trim().length === 0) {
            throw AppErrors.badRequest('Serial number is required for validation');
        }
    }
}
