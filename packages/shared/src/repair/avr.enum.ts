export enum AvrStatus {
    NONE = 'none',
    GENERATED = 'generated',
    PENDING_SIGNATURE = 'pending_signature',
    SIGNED_DIGITAL = 'signed_digital',
    SIGNED_OFFLINE = 'signed_offline',
}

export enum AvrSigningMethod {
    DIGITAL = 'digital',
    OFFLINE = 'offline',
}

export enum SigningOtpChannel {
    PHONE = 'phone',
    EMAIL = 'email',
    PASSWORD = 'password',
}
