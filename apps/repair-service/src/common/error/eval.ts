import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { RepairErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Repair ---
    repairNotFound: (msg?: string) => createAppError(RepairErrorTypeEnum.REPAIR_NOT_FOUND, msg),
    repairInvalidStatus: (msg?: string) => createAppError(RepairErrorTypeEnum.REPAIR_INVALID_STATUS, msg),
};
