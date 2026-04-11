export const MFA_OTP_LENGTH = 6;
export const MFA_OTP_EXPIRY_SECONDS = 300; // 5 minutes
export const MFA_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const MFA_CHALLENGE_TOKEN_EXPIRY = '5m';
export const MFA_OTP_MAX_ATTEMPTS = 5;

export const MFA_OTP_REDIS_PREFIX = 'mfa:otp:';
export const MFA_OTP_COOLDOWN_REDIS_PREFIX = 'mfa:cooldown:';
export const MFA_OTP_ATTEMPTS_REDIS_PREFIX = 'mfa:attempts:';

export const PHONE_OTP_REDIS_PREFIX = 'phone:otp:';
export const PHONE_OTP_COOLDOWN_REDIS_PREFIX = 'phone:cooldown:';
export const PHONE_OTP_ATTEMPTS_REDIS_PREFIX = 'phone:attempts:';
export const PHONE_OTP_PENDING_REG_PREFIX = 'phone:pending_reg:';

export const MFA_TRUSTED_DEVICE_COOKIE = {
    cookie: {
        name: 'trustedDevice',
        options: {
            sameSite: 'strict' as const,
            secure: true,
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
    },
};
