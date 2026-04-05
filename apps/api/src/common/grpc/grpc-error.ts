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

/**
 * Fields that are `repeated` in proto and arrive as `undefined` when empty
 * due to protobuf3 default value omission. Normalized to `[]`.
 */
const ARRAY_FIELDS = new Set([
    // paginated responses
    'data',
    // list responses
    'images', 'videos', 'parts', 'steps', 'certificates', 'reviews', 'clients',
    'withdrawals', 'invites', 'userDevices', 'addresses', 'payments',
    'repairers', 'devices', 'participants', 'presences', 'links',
    // entity array fields
    'roles', 'providers', 'specializations', 'tags',
    'workSteps', 'brokenParts', 'rejectedRepairers',
]);

function normalizeGrpcResponse<T>(data: T): T {
    if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) {
        return data;
    }

    const obj = data as Record<string, any>;
    for (const key of Object.keys(obj)) {
        if (obj[key] === undefined && ARRAY_FIELDS.has(key)) {
            obj[key] = [];
        }
        // one level deep: normalize nested objects (e.g. wrapped entities like { request: { brokenParts: undefined } })
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const nested = obj[key] as Record<string, any>;
            for (const nk of Object.keys(nested)) {
                if (nested[nk] === undefined && ARRAY_FIELDS.has(nk)) {
                    nested[nk] = [];
                }
            }
        }
    }

    return data;
}

export async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    try {
        const result = await lastValueFrom(observable);
        return normalizeGrpcResponse(result);
    } catch (e) {
        fromGrpcError(e);
    }
}
