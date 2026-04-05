/**
 * Injection token for gateway configuration.
 * The consuming app must provide a value for this token
 * that satisfies the IGatewayConfig interface.
 */
export const GATEWAY_CONFIG = Symbol('GATEWAY_CONFIG');
