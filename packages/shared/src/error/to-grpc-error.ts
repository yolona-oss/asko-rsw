import { AppError } from './app-error.js';

// gRPC status codes (from @grpc/grpc-js — inlined to avoid adding the dependency)
const GRPC_INVALID_ARGUMENT = 3;
const GRPC_NOT_FOUND = 5;
const GRPC_ALREADY_EXISTS = 6;
const GRPC_PERMISSION_DENIED = 7;
const GRPC_RESOURCE_EXHAUSTED = 8;
const GRPC_INTERNAL = 13;
const GRPC_UNAUTHENTICATED = 16;

/**
 * Convert an unknown error into a `{ code, message }` payload
 * suitable for `new RpcException(...)`.
 *
 * When the error carries a `messageKey` (i18n), the details field
 * is a JSON envelope so the gateway can reconstruct it:
 *   `{"k":"auth.invalidCode","p":{"seconds":30},"m":"Invalid code"}`
 *
 * Usage in gRPC controllers:
 * ```ts
 * import { RpcException } from '@nestjs/microservices';
 * import { appErrorToGrpcPayload } from '@asko/shared';
 *
 * function toGrpcError(error: unknown): RpcException {
 *     return new RpcException(appErrorToGrpcPayload(error));
 * }
 * ```
 */
export function appErrorToGrpcPayload(error: unknown): { code: number; message: string } {
    if (error instanceof AppError) {
        let code: number;
        switch (true) {
            case error.httpStatus === 401: code = GRPC_UNAUTHENTICATED; break;
            case error.httpStatus === 403: code = GRPC_PERMISSION_DENIED; break;
            case error.httpStatus === 404: code = GRPC_NOT_FOUND; break;
            case error.httpStatus === 409: code = GRPC_ALREADY_EXISTS; break;
            case error.httpStatus === 429: code = GRPC_RESOURCE_EXHAUSTED; break;
            case error.httpStatus >= 400 && error.httpStatus < 500: code = GRPC_INVALID_ARGUMENT; break;
            default: code = GRPC_INTERNAL; break;
        }

        let message: string;
        if (error.messageKey) {
            // JSON envelope carries key + params for gateway-side translation
            message = JSON.stringify({
                k: error.messageKey,
                p: error.messageParams ?? {},
                m: error.message,
            });
        } else {
            message = error.message;
        }

        return { code, message };
    }

    const msg = error instanceof Error ? error.message : String(error);
    return { code: GRPC_INTERNAL, message: msg };
}
