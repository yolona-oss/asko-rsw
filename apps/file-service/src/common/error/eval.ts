import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { FileErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- File ---
    fileUploadFailed: (msg?: string | TranslatableMessage) => createAppError(FileErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string | TranslatableMessage) => createAppError(FileErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
