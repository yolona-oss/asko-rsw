// Decorators
export {
    IS_PUBLIC_KEY, Public,
    IS_OPTIONAL_AUTH_KEY, OptionalAuth,
    ROLES_KEY, RequiredRoles,
    JwtAuthUser,
} from './decorators';

// Guards
export { JwtGuard, GATEWAY_CONFIG } from './guards';
export type { IGatewayConfig } from './guards';

// Filters
export { GlobalExceptionFilter } from './filters';

// gRPC utilities
export { fromGrpcError, grpcCall, grpcStreamUpload } from './grpc';
export type { StreamUploadOptions } from './grpc';

// Streaming upload helpers
export { StreamingUploadInterceptor, StreamingFile, assertMime } from './upload';
export type { StreamingUploadPayload } from './upload';

// Auth utilities
export { isStaff, isAdmin, isSuperAdmin, isSelf, assertSelfOrStaff } from './auth';

// Config
export { corsOptions } from './config/cors.config';
export { helmetOptions } from './config/helmet.config';

// DTOs
export {
    MessageResponseDto, DeleteCountResponseDto, EmptyResponseDto,
    AuthUserDto, AuthSessionResponseDto, AccessTokenResponseDto, ConfirmEmailResponseDto,
    InviteLinkResponseDto, InviteCreatedResponseDto,
} from './dto';

// Modules
export { UserClientModule, UserClientService } from './modules';
export type { UserClientModuleOptions } from './modules';
export { USER_CLIENT_OPTIONS } from './modules';
