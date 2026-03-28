import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class VerifyMfaOtpDto {
    @IsString()
    mfaToken: string;

    @IsString()
    code: string;

    @IsOptional()
    @IsBoolean()
    trustDevice?: boolean;
}

export class ResendMfaOtpDto {
    @IsString()
    mfaToken: string;
}

export class DisableMfaDto {
    @IsString()
    code: string;
}

export class VerifyEnableMfaDto {
    @IsString()
    code: string;
}

export class VerifyPhoneRegisterDto {
    @IsString()
    pendingToken: string;

    @IsString()
    code: string;
}

export class ResendPhoneRegisterOtpDto {
    @IsString()
    pendingToken: string;
}
