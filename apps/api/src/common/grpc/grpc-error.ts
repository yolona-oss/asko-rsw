import { lastValueFrom, Observable } from 'rxjs';
import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';

export function fromGrpcError(error: any): never {
    if (error?.code !== undefined && error?.message) {
        const msg = error.details || error.message;
        let appErrorType: AppErrorTypeEnum;
        switch (error.code) {
            case 5: appErrorType = AppErrorTypeEnum.DB_ENTITY_NOT_FOUND; break;   // NOT_FOUND
            case 6: appErrorType = AppErrorTypeEnum.DB_ENTITY_EXISTS; break;       // ALREADY_EXISTS
            case 3: appErrorType = AppErrorTypeEnum.INVALID_DATA; break;           // INVALID_ARGUMENT
            case 16: appErrorType = AppErrorTypeEnum.UNAUTHORIZED; break;          // UNAUTHENTICATED
            case 7: appErrorType = AppErrorTypeEnum.FORBIDDEN; break;              // PERMISSION_DENIED
            case 8: appErrorType = AppErrorTypeEnum.TOO_MANY_REQUESTS; break;      // RESOURCE_EXHAUSTED
            default: appErrorType = AppErrorTypeEnum.INTERNAL_ERROR; break;
        }
        throw new AppError(appErrorType, { message: msg });
    }
    if (error instanceof AppError) throw error;
    throw AppErrors.internalError(error?.message ?? 'gRPC call failed');
}

export async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    try {
        return await lastValueFrom(observable);
    } catch (e) {
        fromGrpcError(e);
    }
}
