import type { ValidationContext } from 'common/validation';

export interface DeviceValidationContext extends ValidationContext {
    userDeviceId: string;
    deviceId: string;
    serialNumber: string;
}
