import './definition'; // side-effect: registers realtime-gateway-specific error definitions

export { AppError, AppErrorTypeEnum, isAppError, wrapError, throwAppError } from '@asko/shared';
export type { IErrorMessage } from '@asko/shared';
export { RealtimeGatewayErrorTypeEnum } from './error-type.enum';
export { AppErrors, createAppError } from './eval';
