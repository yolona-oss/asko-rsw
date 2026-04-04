import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    UserServiceClient,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    AccessTokenResponse,
    ConfirmEmailRequest,
    ConfirmEmailResponse,
    ResendConfirmationRequest,
    ResendConfirmationResponse,
    RefreshTokenRequest,
    LogoutRequest,
    FindByTokenRequest,
    AuthUserResponse,
    UserIdRequest,
    PaginatedUsersResponse,
    UpdateUserRequest,
    ChangePasswordRequest,
    AddRoleRequest,
    RemoveRoleRequest,
    SetUserActiveRequest,
    UserResponse,
    CreateInviteRequest,
    InviteCreatedResponse,
    InviteListResponse,
    InviteLinkResponse,
    InviteIdRequest,
    InviteTokenRequest,
    EmptyResponse,
    SearchUsersForChatRequest,
    SearchUsersForChatResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    RequestEmailChangeRequest,
    RequestEmailChangeResponse,
    ConfirmEmailChangeRequest,
    ConfirmEmailChangeResponse,
    LoginResponse,
    VerifyMfaRequest,
    VerifyMfaResponse,
    ResendMfaOtpRequest,
    ResendMfaOtpResponse,
    EnableMfaRequest,
    EnableMfaResponse,
    VerifyEnableMfaRequest,
    VerifyEnableMfaResponse,
    InitiateDisableMfaRequest,
    InitiateDisableMfaResponse,
    ConfirmDisableMfaRequest,
    ConfirmDisableMfaResponse,
    GetMfaStatusRequest,
    GetMfaStatusResponse,
    VerifyPhoneRegisterRequest,
    ResendPhoneRegisterOtpRequest,
    ResendPhoneRegisterOtpResponse,
    SendPhoneVerificationRequest,
    SendPhoneVerificationResponse,
    ConfirmPhoneVerificationRequest,
    ConfirmPhoneVerificationResponse,
    RequestPhoneChangeRequest,
    RequestPhoneChangeResponse,
    ConfirmPhoneChangeRequest,
    ConfirmPhoneChangeResponse,
} from '@asko/proto';

@Injectable()
export class UserClientService implements OnModuleInit {
    private userService!: UserServiceClient;

    constructor(
        @Inject('USER_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.userService = this.client.getService<UserServiceClient>('UserService');
    }

    // ─── Auth ────────────────────────────────────────────────────────────

    login(data: LoginRequest): Promise<LoginResponse> {
        return grpcCall(this.userService.login(data));
    }

    register(data: RegisterRequest): Promise<RegisterResponse> {
        return grpcCall(this.userService.register(data));
    }

    confirmEmail(data: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
        return grpcCall(this.userService.confirmEmail(data));
    }

    resendConfirmation(data: ResendConfirmationRequest): Promise<ResendConfirmationResponse> {
        return grpcCall(this.userService.resendConfirmation(data));
    }

    refreshAccessToken(data: RefreshTokenRequest): Promise<AccessTokenResponse> {
        return grpcCall(this.userService.refreshAccessToken(data));
    }

    logout(data: LogoutRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.logout(data));
    }

    findUserByAccessToken(data: FindByTokenRequest): Promise<AuthUserResponse> {
        return grpcCall(this.userService.findUserByAccessToken(data));
    }

    forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        return grpcCall(this.userService.forgotPassword(data));
    }

    resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        return grpcCall(this.userService.resetPassword(data));
    }

    requestEmailChange(data: RequestEmailChangeRequest): Promise<RequestEmailChangeResponse> {
        return grpcCall(this.userService.requestEmailChange(data));
    }

    confirmEmailChange(data: ConfirmEmailChangeRequest): Promise<ConfirmEmailChangeResponse> {
        return grpcCall(this.userService.confirmEmailChange(data));
    }

    // ─── MFA ──────────────────────────────────────────────────────────────

    verifyMfaOtp(data: VerifyMfaRequest): Promise<VerifyMfaResponse> {
        return grpcCall(this.userService.verifyMfaOtp(data));
    }

    resendMfaOtp(data: ResendMfaOtpRequest): Promise<ResendMfaOtpResponse> {
        return grpcCall(this.userService.resendMfaOtp(data));
    }

    enableMfa(data: EnableMfaRequest): Promise<EnableMfaResponse> {
        return grpcCall(this.userService.enableMfa(data));
    }

    verifyEnableMfa(data: VerifyEnableMfaRequest): Promise<VerifyEnableMfaResponse> {
        return grpcCall(this.userService.verifyEnableMfa(data));
    }

    initiateDisableMfa(data: InitiateDisableMfaRequest): Promise<InitiateDisableMfaResponse> {
        return grpcCall(this.userService.initiateDisableMfa(data));
    }

    confirmDisableMfa(data: ConfirmDisableMfaRequest): Promise<ConfirmDisableMfaResponse> {
        return grpcCall(this.userService.confirmDisableMfa(data));
    }

    getMfaStatus(data: GetMfaStatusRequest): Promise<GetMfaStatusResponse> {
        return grpcCall(this.userService.getMfaStatus(data));
    }

    // ─── Phone Register ─────────────────────────────────────────────────

    verifyPhoneRegister(data: VerifyPhoneRegisterRequest): Promise<RegisterResponse> {
        return grpcCall(this.userService.verifyPhoneRegister(data));
    }

    resendPhoneRegisterOtp(data: ResendPhoneRegisterOtpRequest): Promise<ResendPhoneRegisterOtpResponse> {
        return grpcCall(this.userService.resendPhoneRegisterOtp(data));
    }

    // ─── Phone Verification ─────────────────────────────────────────────

    sendPhoneVerification(data: SendPhoneVerificationRequest): Promise<SendPhoneVerificationResponse> {
        return grpcCall(this.userService.sendPhoneVerification(data));
    }

    confirmPhoneVerification(data: ConfirmPhoneVerificationRequest): Promise<ConfirmPhoneVerificationResponse> {
        return grpcCall(this.userService.confirmPhoneVerification(data));
    }

    requestPhoneChange(data: RequestPhoneChangeRequest): Promise<RequestPhoneChangeResponse> {
        return grpcCall(this.userService.requestPhoneChange(data));
    }

    confirmPhoneChange(data: ConfirmPhoneChangeRequest): Promise<ConfirmPhoneChangeResponse> {
        return grpcCall(this.userService.confirmPhoneChange(data));
    }

    // ─── User CRUD ───────────────────────────────────────────────────────

    findAllUsers(data: { page?: number; limit?: number; search?: string; role?: string; status?: string; sortBy?: string; sortOrder?: string }): Promise<PaginatedUsersResponse> {
        return grpcCall(this.userService.findAllUsers({
            page: data.page ?? 0,
            limit: data.limit ?? 10,
            search: data.search ?? '',
            role: data.role ?? '',
            status: data.status ?? '',
            sortBy: data.sortBy ?? '',
            sortOrder: data.sortOrder ?? '',
        }));
    }

    findUserById(data: UserIdRequest): Promise<UserResponse> {
        return grpcCall(this.userService.findUserById(data));
    }

    findUserByEmail(email: string): Promise<UserResponse> {
        return grpcCall(this.userService.findUserByEmail({ email }));
    }

    deleteUser(data: UserIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.deleteUser(data));
    }

    updateUser(data: UpdateUserRequest): Promise<UserResponse> {
        return grpcCall(this.userService.updateUser(data));
    }

    changePassword(data: ChangePasswordRequest): Promise<UserResponse> {
        return grpcCall(this.userService.changePassword(data));
    }

    getProfile(data: UserIdRequest): Promise<UserResponse> {
        return grpcCall(this.userService.getProfile(data));
    }

    setEmailConfirmed(data: UserIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.setEmailConfirmed(data));
    }

    addRole(data: AddRoleRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.addRole(data));
    }

    removeRole(data: RemoveRoleRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.removeRole(data));
    }

    setUserActive(data: SetUserActiveRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.setUserActive(data));
    }

    // ─── Invite ──────────────────────────────────────────────────────────

    createInvite(data: CreateInviteRequest): Promise<InviteCreatedResponse> {
        return grpcCall(this.userService.createInvite(data));
    }

    findAllInvites(): Promise<InviteListResponse> {
        return grpcCall(this.userService.findAllInvites({}));
    }

    checkInvite(data: InviteTokenRequest): Promise<InviteLinkResponse> {
        return grpcCall(this.userService.checkInvite(data));
    }

    deleteInvite(data: InviteIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.deleteInvite(data));
    }

    // ─── Chat ──────────────────────────────────────────────────────────

    searchUsersForChat(data: SearchUsersForChatRequest): Promise<SearchUsersForChatResponse> {
        return grpcCall(this.userService.searchUsersForChat(data));
    }
}
