import { Injectable } from '@nestjs/common';

/**
 * Placeholder service for external serial number / certificate validation.
 * Will be implemented when integration with manufacturer APIs is available.
 */
@Injectable()
export class ExternalCertValidationService {
    /**
     * Validate a serial number against manufacturer records.
     * Currently returns true (no external validation configured).
     */
    async validateSerialNumber(_serialNumber: string): Promise<{ valid: boolean; reason?: string }> {
        // TODO: integrate with manufacturer API
        return { valid: true };
    }

    /**
     * Validate a certificate number against external registry.
     * Currently returns true (no external validation configured).
     */
    async validateCertificateNumber(_certificateNumber: string): Promise<{ valid: boolean; reason?: string }> {
        // TODO: integrate with external certificate registry
        return { valid: true };
    }
}
