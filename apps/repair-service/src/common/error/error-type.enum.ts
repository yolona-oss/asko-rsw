export { AppErrorTypeEnum } from '@asko/shared';

// Domain-specific repair error codes (range 1000+)
export enum RepairErrorTypeEnum {
    REPAIR_NOT_FOUND = 1000,
    REPAIR_INVALID_STATUS,
}
