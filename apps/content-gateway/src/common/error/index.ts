import './definition'; // side-effect: registers gateway-specific error definitions

export { AppError, AppErrorTypeEnum, isAppError, wrapError, throwAppError } from '@asko/shared';
export type { IErrorMessage } from '@asko/shared';
export { GatewayErrorTypeEnum } from './error-type.enum';
export { AppErrors, createAppError } from './eval';
