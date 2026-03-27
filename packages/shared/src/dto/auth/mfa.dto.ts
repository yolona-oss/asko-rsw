export class VerifyMfaOtpDto {
    mfaToken: string
    code: string
    trustDevice?: boolean
}

export class ResendMfaOtpDto {
    mfaToken: string
}

export class DisableMfaDto {
    code: string
}

export class VerifyEnableMfaDto {
    code: string
}
