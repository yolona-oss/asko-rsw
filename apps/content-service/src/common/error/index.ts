import './definition'; // side-effect: registers domain-specific error definitions

export { AppError, AppErrorTypeEnum, isAppError, wrapError, throwAppError } from '@asko/shared';
export type { IErrorMessage } from '@asko/shared';
export { ContentErrorTypeEnum } from './error-type.enum';
export { AppErrors, createAppError } from './eval';
