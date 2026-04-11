// import { MAX_USER_PASSWORD_LENGTH, MIN_USER_PASSWORD_LENGTH } from '../../constants.js';

export class ChangePasswordDto {
    oldPassword: string
    newPassword: string
}

export class ForgotPasswordDto {
    email: string
}

export class ResetPasswordDto {
    token: string
    newPassword: string
}

export class RequestEmailChangeDto {
    newEmail: string
}
