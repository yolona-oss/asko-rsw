import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
/**
 * Mark a route as optionally authenticated.
 * If a valid JWT is present, the user payload is attached to the request.
 * If no token or an invalid token is provided, the request proceeds without user context.
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
