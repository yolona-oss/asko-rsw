import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { RepairErrorTypeEnum } from './error-type.enum';

const RepairErrorsDefinition: Record<number, IErrorMessage> = {
    [RepairErrorTypeEnum.REPAIR_NOT_FOUND]: { httpStatus: 404, message: 'Repair request not found' },
    [RepairErrorTypeEnum.REPAIR_INVALID_STATUS]: { httpStatus: 400, message: 'Invalid repair request status' },
};

AppError.registerDefinitions(RepairErrorsDefinition);
