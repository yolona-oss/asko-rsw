import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { FileErrorTypeEnum } from './error-type.enum';

const FileErrorsDefinition: Record<number, IErrorMessage> = {
    [FileErrorTypeEnum.FILE_UPLOAD_FAILED]: { httpStatus: 400, message: 'File upload failed' },
    [FileErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE]: { httpStatus: 503, message: 'External service unavailable' },
};

AppError.registerDefinitions(FileErrorsDefinition);
