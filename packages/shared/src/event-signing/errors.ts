import { AppError } from '../error/app-error.js';
import { AppErrorTypeEnum } from '../error/error-type.enum.js';

/** Signature missing, malformed, or doesn't match the payload under any known key. */
export class InvalidEventSignatureError extends AppError {
    constructor(message = 'Invalid event signature') {
        super(AppErrorTypeEnum.UNAUTHORIZED, { message });
        this.name = 'InvalidEventSignatureError';
    }
}

/** Envelope timestamp is outside the accepted skew window. */
export class EventSkewError extends AppError {
    constructor(message = 'Event timestamp outside accepted skew') {
        super(AppErrorTypeEnum.UNAUTHORIZED, { message });
        this.name = 'EventSkewError';
    }
}

/** Envelope nonce was already seen (optional anti-replay, when a nonce store is configured). */
export class EventReplayError extends AppError {
    constructor(message = 'Event nonce replayed') {
        super(AppErrorTypeEnum.UNAUTHORIZED, { message });
        this.name = 'EventReplayError';
    }
}
